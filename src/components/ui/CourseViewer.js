import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCourseProgress, markLessonComplete, updateCoursePosition } from '../../firebase/services';
import Card from './Card';
import Button from './Button';

const CourseViewer = ({ course, onClose }) => {
  const { currentUser } = useAuth();
  const [currentSection, setCurrentSection] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user progress on component mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!currentUser || !course.id) return;
      
      try {
        setLoading(true);
        const progressResult = await getCourseProgress(currentUser.uid, course.id);
        
        if (progressResult.success && progressResult.data) {
          const progress = progressResult.data;
          
          // Set current position
          if (progress.currentSection !== undefined) {
            setCurrentSection(progress.currentSection);
          }
          if (progress.currentLesson !== undefined) {
            setCurrentLesson(progress.currentLesson);
          }
          
          // Set completed lessons
          if (progress.completedLessons && Array.isArray(progress.completedLessons)) {
            setCompletedLessons(new Set(progress.completedLessons));
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProgress();
  }, [currentUser, course.id]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLessonComplete = async (sectionIndex, lessonIndex) => {
    if (!currentUser || saving) return;
    
    try {
      setSaving(true);
      const lessonId = `${sectionIndex}-${lessonIndex}`;
      
      // Update local state
      setCompletedLessons(prev => new Set([...prev, lessonId]));
      
      // Save to Firebase
      const result = await markLessonComplete(currentUser.uid, course.id, sectionIndex, lessonIndex);
      
      if (!result.success) {
        console.error('Error saving progress:', result.error);
        // Revert local state on error
        setCompletedLessons(prev => {
          const newSet = new Set(prev);
          newSet.delete(lessonId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLessonSelect = async (sectionIndex, lessonIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentLesson(lessonIndex);
    
    // Save position to Firebase
    if (currentUser) {
      try {
        await updateCoursePosition(currentUser.uid, course.id, sectionIndex, lessonIndex);
      } catch (error) {
        console.error('Error updating course position:', error);
      }
    }
    
    // Close sidebar on mobile after selecting a lesson
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const getProgressPercentage = () => {
    const totalLessons = course.sections.reduce((total, section) => total + section.lessons.length, 0);
    const completedCount = completedLessons.size;
    return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  };

  const isCourseCompleted = () => {
    const totalLessons = course.sections.reduce((total, section) => total + section.lessons.length, 0);
    return completedLessons.size >= totalLessons;
  };

  const currentLessonData = course.sections[currentSection]?.lessons[currentLesson];
  
  // Debug logging
  console.log('CourseViewer - Course data:', course);
  console.log('CourseViewer - Current section:', currentSection);
  console.log('CourseViewer - Current lesson:', currentLesson);
  console.log('CourseViewer - Current lesson data:', currentLessonData);
  console.log('CourseViewer - Video URL:', currentLessonData?.videoUrl);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col sm:flex-row overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-900 truncate">{course.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {isMobile && showSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Course Sidebar */}
        <div className={`${isMobile ? (showSidebar ? 'fixed inset-y-0 left-0 z-50 w-80 max-w-[90vw]' : 'hidden') : 'w-1/3'} bg-gray-50 border-r border-gray-200 overflow-y-auto`}>
          <div className="p-4 sm:p-6">
            {!isMobile && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-gray-900">{course.title}</h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{getProgressPercentage()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>
                
                {/* Course Completion Banner */}
                {isCourseCompleted() && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-800 text-sm font-medium">Course Completed!</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile sidebar header */}
            {isMobile && (
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{course.title}</h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Course Info */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium text-gray-900">{getProgressPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>

            {/* Course Description */}
            <p className="text-sm text-gray-600 mb-6">{course.description}</p>

            {/* Course Sections */}
            <div className="space-y-2">
              {course.sections.map((section, sectionIndex) => (
                <div key={section.id || sectionIndex}>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 mb-2">
                    <h3 className="font-medium text-gray-900">{section.title}</h3>
                    <span className="text-xs text-gray-500">{section.lessons.length} lessons</span>
                  </div>
                  
                  <div className="ml-4 space-y-1">
                    {section.lessons.map((lesson, lessonIndex) => {
                      const lessonId = `${sectionIndex}-${lessonIndex}`;
                      const isCompleted = completedLessons.has(lessonId);
                      const isCurrent = currentSection === sectionIndex && currentLesson === lessonIndex;
                      
                      return (
                        <button
                          key={lesson.id || lessonIndex}
                          onClick={() => handleLessonSelect(sectionIndex, lessonIndex)}
                          className={`w-full text-left p-3 rounded-lg text-sm transition-colors duration-200 ${
                            isCurrent
                              ? 'bg-primary-100 text-primary-700 border border-primary-200'
                              : isCompleted
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              isCompleted
                                ? 'bg-blue-500 text-white'
                                : isCurrent
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}>
                              {isCompleted ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                lessonIndex + 1
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{lesson.title}</p>
                              {lesson.duration && (
                                <p className="text-xs text-gray-500">{lesson.duration}</p>
                              )}
                            </div>
                            {lesson.isPreview && (
                              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                                Preview
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Video/Content Area */}
          <div className="flex-1 bg-black min-h-0">
            {currentLessonData ? (
              <div className="h-full flex items-center justify-center p-2 sm:p-4">
                {currentLessonData.videoUrl ? (
                  <div className="w-full h-full relative">
                    {currentLessonData.videoUrl.includes('youtube.com') || currentLessonData.videoUrl.includes('youtu.be') ? (
                      // YouTube embed
                      <iframe
                        src={currentLessonData.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                        title={`${currentLessonData.title} - Video`}
                        className="w-full h-full rounded-lg"
                        frameBorder="0"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    ) : currentLessonData.videoUrl.includes('vimeo.com') ? (
                      // Vimeo embed
                      <iframe
                        src={currentLessonData.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                        title={`${currentLessonData.title} - Video`}
                        className="w-full h-full rounded-lg"
                        frameBorder="0"
                        allowFullScreen
                        allow="autoplay; fullscreen; picture-in-picture"
                      />
                    ) : (
                      // Direct video file
                      <video
                        src={currentLessonData.videoUrl}
                        controls
                        className="w-full h-full object-contain rounded-lg"
                        preload="metadata"
                        playsInline
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-white p-8">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{currentLessonData.title}</h3>
                    <p className="text-gray-300 mb-4">No video content available</p>
                    <p className="text-sm text-gray-400">Add a video URL to this lesson to see content here</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-white p-4">
                <div className="text-center max-w-4xl w-full">
                  {course.previewVideoUrl ? (
                    <div className="w-full mx-auto">
                      {course.previewVideoUrl.includes('youtube.com') || course.previewVideoUrl.includes('youtu.be') ? (
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            src={course.previewVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                            title={`${course.title} - Preview`}
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            frameBorder="0"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>
                      ) : course.previewVideoUrl.includes('vimeo.com') ? (
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            src={course.previewVideoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                            title={`${course.title} - Preview`}
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            frameBorder="0"
                            allowFullScreen
                            allow="autoplay; fullscreen; picture-in-picture"
                          />
                        </div>
                      ) : (
                        <video
                          src={course.previewVideoUrl}
                          controls
                          className="w-full h-auto rounded-lg"
                          style={{ maxHeight: '400px' }}
                          preload="metadata"
                          playsInline
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold">Welcome to {course.title}</h3>
                      <p className="text-gray-300">
                        {isMobile ? 'Tap the menu button above to select a lesson' : 'Select a lesson from the sidebar to start learning'}
                      </p>
                      <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                        <span>{course.sections.length} {course.sections.length === 1 ? 'section' : 'sections'}</span>
                        <span>•</span>
                        <span>{course.sections.reduce((total, section) => total + section.lessons.length, 0)} lessons</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lesson Info Bar */}
          {currentLessonData && (
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg sm:text-base">{currentLessonData.title}</h3>
                  {currentLessonData.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{currentLessonData.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  {currentLessonData.duration && (
                    <span className="text-sm text-gray-500 whitespace-nowrap">{currentLessonData.duration}</span>
                  )}
                  <Button
                    onClick={() => handleLessonComplete(currentSection, currentLesson)}
                    disabled={completedLessons.has(`${currentSection}-${currentLesson}`) || saving}
                    loading={saving}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {completedLessons.has(`${currentSection}-${currentLesson}`) ? 'Completed' : 'Mark Complete'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
