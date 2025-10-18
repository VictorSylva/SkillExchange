import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllPublicCourses, getConnectedUsersCourses } from '../firebase/services';
import { useProgress } from '../hooks/useProgress';
import LearningCard from '../components/ui/LearningCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import CourseViewer from '../components/ui/CourseViewer';
import Footer from '../components/Footer';

const Browse = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { getCourseProgress } = useProgress();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [allCourses, setAllCourses] = useState([]);
  const [connectedUsersCourses, setConnectedUsersCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);


  // Extract unique categories from courses
  const getCategories = () => {
    const categorySet = new Set(['All']);
    const allCoursesCombined = [...allCourses, ...connectedUsersCourses];
    allCoursesCombined.forEach(course => {
      if (course.tags && Array.isArray(course.tags)) {
        course.tags.forEach(tag => categorySet.add(tag));
      }
    });
    return Array.from(categorySet);
  };

  // Combine public courses and connected users courses
  const combinedCourses = [...allCourses, ...connectedUsersCourses];
  
  const filteredContent = selectedCategory === 'All' 
    ? combinedCourses 
    : combinedCourses.filter(course => 
        course.tags && course.tags.some(tag => 
          tag.toLowerCase().includes(selectedCategory.toLowerCase())
        )
      );

  const handleBookmark = (learningId) => {
    console.log('Bookmarked learning:', learningId);
    alert('Added to your bookmarks!');
  };

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [publicCoursesResult, connectedCoursesResult] = await Promise.all([
        getAllPublicCourses(),
        userProfile?.uid ? getConnectedUsersCourses(userProfile.uid) : Promise.resolve({ success: true, data: [] })
      ]);
      
      if (publicCoursesResult.success) {
        setAllCourses(publicCoursesResult.data || []);
      } else {
        setError('Failed to load courses');
        setAllCourses([]);
      }
      
      if (connectedCoursesResult.success) {
        setConnectedUsersCourses(connectedCoursesResult.data || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Failed to load courses');
      setAllCourses([]);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.uid]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Browse Learning Content
          </h1>
          <p className="text-lg text-gray-600">
            Discover amazing skills and connect with expert instructors
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {getCategories().slice(0, 10).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="mx-auto h-20 w-20 text-red-300 mb-6">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Error loading courses</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadCourses}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredContent.map((course, index) => (
                <LearningCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  instructor={course.instructorName}
                  instructorTitle={course.instructorTitle}
                  duration={course.duration}
                  students={Math.floor(Math.random() * 10000) + 1000} // Random for demo
                  level={course.level}
                  rating={4.5 + Math.random() * 0.5} // Random rating for demo
                  tags={course.tags || []}
                  isStaffPick={Math.random() > 0.5} // Random staff pick for demo
                  isBookmarked={false}
                  isFromConnection={course.isFromConnection}
                  thumbnail={course.thumbnailUrl}
                  thumbnailUrl={course.thumbnailUrl}
                  previewVideoUrl={course.previewVideoUrl}
                  progress={getCourseProgress(course.id)}
                  onBookmark={handleBookmark}
                  onClick={() => setSelectedCourse(course)}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                />
              ))}
            </div>

            {/* Empty State */}
            {filteredContent.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="mx-auto h-20 w-20 text-gray-300 mb-6">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {selectedCategory === 'All' ? 'No courses available yet' : `No courses found in ${selectedCategory}`}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedCategory === 'All' 
                    ? 'Be the first to create a course and share your knowledge with the community!'
                    : 'Try selecting a different category or check back later for new content.'
                  }
                </p>
                {selectedCategory === 'All' && (
                  <button 
                    onClick={() => navigate('/profile?tab=teaching')}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200"
                  >
                    Create Your First Course
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Course Viewer Modal */}
      {selectedCourse && (
        <CourseViewer
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default Browse;
