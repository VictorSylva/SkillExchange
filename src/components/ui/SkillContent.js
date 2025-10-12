import React, { useState } from 'react';
import Card from './Card';
import Button from './Button';
import Input from './Input';

const SkillContent = ({ 
  skillContent = null, 
  onSave, 
  onCancel,
  isEditing = false 
}) => {
  const [content, setContent] = useState(skillContent || {
    title: '',
    description: '',
    previewVideo: null,
    previewVideoUrl: '',
    thumbnail: null,
    thumbnailUrl: '',
    level: 'Beginner',
    duration: '',
    sections: [],
    price: 0,
    isPublic: false
  });

  const [currentSection, setCurrentSection] = useState({
    title: '',
    lessons: []
  });

  const [currentLesson, setCurrentLesson] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: '',
    isPreview: false
  });

  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingSectionIndex, setEditingSectionIndex] = useState(-1);
  const [editingLessonIndex, setEditingLessonIndex] = useState(-1);

  const handleInputChange = (field, value) => {
    setContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // In a real app, you'd upload to a service like AWS S3, Cloudinary, etc.
      const videoUrl = URL.createObjectURL(file);
      setContent(prev => ({
        ...prev,
        previewVideo: file, // Keep file for display
        previewVideoUrl: videoUrl // Use URL for storage
      }));
    }
  };

  const handleThumbnailUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const thumbnailUrl = URL.createObjectURL(file);
      setContent(prev => ({
        ...prev,
        thumbnail: file, // Keep file for display
        thumbnailUrl: thumbnailUrl // Use URL for storage
      }));
    }
  };

  const addSection = () => {
    if (currentSection.title.trim()) {
      const newSections = [...content.sections, { ...currentSection, id: Date.now() }];
      setContent(prev => ({
        ...prev,
        sections: newSections
      }));
      setCurrentSection({ title: '', lessons: [] });
      setShowSectionForm(false);
    }
  };

  const editSection = (index) => {
    setCurrentSection(content.sections[index]);
    setEditingSectionIndex(index);
    setShowSectionForm(true);
  };

  const updateSection = () => {
    if (currentSection.title.trim()) {
      const newSections = [...content.sections];
      newSections[editingSectionIndex] = { ...currentSection };
      setContent(prev => ({
        ...prev,
        sections: newSections
      }));
      setCurrentSection({ title: '', lessons: [] });
      setEditingSectionIndex(-1);
      setShowSectionForm(false);
    }
  };

  const deleteSection = (index) => {
    const newSections = content.sections.filter((_, i) => i !== index);
    setContent(prev => ({
      ...prev,
      sections: newSections
    }));
  };

  const addLesson = () => {
    if (currentLesson.title.trim()) {
      const newLesson = { ...currentLesson, id: Date.now() };
      const newSections = [...content.sections];
      
      if (editingSectionIndex >= 0) {
        newSections[editingSectionIndex].lessons.push(newLesson);
      }
      
      setContent(prev => ({
        ...prev,
        sections: newSections
      }));
      setCurrentLesson({ title: '', description: '', videoUrl: '', duration: '', isPreview: false });
      setShowLessonForm(false);
    }
  };

  const editLesson = (sectionIndex, lessonIndex) => {
    const lesson = content.sections[sectionIndex].lessons[lessonIndex];
    setCurrentLesson(lesson);
    setEditingSectionIndex(sectionIndex);
    setEditingLessonIndex(lessonIndex);
    setShowLessonForm(true);
  };

  const updateLesson = () => {
    if (currentLesson.title.trim()) {
      const newSections = [...content.sections];
      newSections[editingSectionIndex].lessons[editingLessonIndex] = { ...currentLesson };
      setContent(prev => ({
        ...prev,
        sections: newSections
      }));
      setCurrentLesson({ title: '', description: '', videoUrl: '', duration: '', isPreview: false });
      setEditingSectionIndex(-1);
      setEditingLessonIndex(-1);
      setShowLessonForm(false);
    }
  };

  const deleteLesson = (sectionIndex, lessonIndex) => {
    const newSections = [...content.sections];
    newSections[sectionIndex].lessons = newSections[sectionIndex].lessons.filter((_, i) => i !== lessonIndex);
    setContent(prev => ({
      ...prev,
      sections: newSections
    }));
  };

  const handleSave = () => {
    if (content.title.trim() && content.description.trim()) {
      onSave(content);
    } else {
      alert('Please fill in the title and description');
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
        
        <div className="space-y-4">
          <Input
            label="Course Title"
            value={content.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter your course title"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Description
            </label>
            <textarea
              value={content.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what students will learn in this course"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={content.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <Input
              label="Estimated Duration"
              value={content.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              placeholder="e.g., 4 hours, 2 weeks"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={content.isPublic}
              onChange={(e) => handleInputChange('isPublic', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
              Make this course public (visible to all users)
            </label>
          </div>
        </div>
      </Card>

      {/* Preview Video */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview Video</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Preview Video
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          {content.previewVideoUrl && (
            <div className="relative">
              {content.previewVideoUrl.includes('youtube.com') || content.previewVideoUrl.includes('youtu.be') ? (
                // YouTube embed
                <iframe
                  src={content.previewVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  title="Course Preview"
                  className="w-full rounded-lg"
                  style={{ height: '300px' }}
                  frameBorder="0"
                  allowFullScreen
                />
              ) : content.previewVideoUrl.includes('vimeo.com') ? (
                // Vimeo embed
                <iframe
                  src={content.previewVideoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                  title="Course Preview"
                  className="w-full rounded-lg"
                  style={{ height: '300px' }}
                  frameBorder="0"
                  allowFullScreen
                />
              ) : (
                // Direct video file
                <video
                  src={content.previewVideoUrl}
                  controls
                  className="w-full rounded-lg"
                  style={{ maxHeight: '300px' }}
                >
                  Your browser does not support the video tag.
                </video>
              )}
              <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                Preview
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Paste Video URL
            </label>
            <input
              type="url"
              value={content.previewVideoUrl}
              onChange={(e) => handleInputChange('previewVideoUrl', e.target.value)}
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports YouTube, Vimeo, or direct video file URLs
            </p>
          </div>
        </div>
      </Card>

      {/* Thumbnail */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Thumbnail</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Thumbnail Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          {content.thumbnailUrl && (
            <div className="w-48 h-32 border-2 border-gray-200 rounded-lg overflow-hidden">
              <img
                src={content.thumbnailUrl}
                alt="Course thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Course Sections */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Course Sections</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentSection({ title: '', lessons: [] });
              setEditingSectionIndex(-1);
              setShowSectionForm(true);
            }}
          >
            Add Section
          </Button>
        </div>

        {/* Sections List */}
        <div className="space-y-4">
          {content.sections.map((section, sectionIndex) => (
            <div key={section.id || sectionIndex} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-medium text-gray-900">{section.title}</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editSection(sectionIndex)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSection(sectionIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Lessons in Section */}
              <div className="space-y-2">
                {section.lessons.map((lesson, lessonIndex) => (
                  <div key={lesson.id || lessonIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center">
                        <span className="text-xs text-primary-600 font-medium">{lessonIndex + 1}</span>
                      </div>
                      <span className="text-sm text-gray-900">{lesson.title}</span>
                      {lesson.isPreview && (
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                          Preview
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editLesson(sectionIndex, lessonIndex)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteLesson(sectionIndex, lessonIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setEditingSectionIndex(sectionIndex);
                  setShowLessonForm(true);
                }}
              >
                Add Lesson
              </Button>
            </div>
          ))}
        </div>

        {content.sections.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No sections added yet. Click "Add Section" to get started.</p>
          </div>
        )}
      </Card>

      {/* Section Form Modal */}
      {showSectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSectionIndex >= 0 ? 'Edit Section' : 'Add Section'}
            </h4>
            
            <div className="space-y-4">
              <Input
                label="Section Title"
                value={currentSection.title}
                onChange={(e) => setCurrentSection(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Introduction, Advanced Concepts"
                required
              />
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={editingSectionIndex >= 0 ? updateSection : addSection}
                className="flex-1"
              >
                {editingSectionIndex >= 0 ? 'Update' : 'Add'} Section
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSectionForm(false);
                  setCurrentSection({ title: '', lessons: [] });
                  setEditingSectionIndex(-1);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Lesson Form Modal */}
      {showLessonForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              {editingLessonIndex >= 0 ? 'Edit Lesson' : 'Add Lesson'}
            </h4>
            
            <div className="space-y-4">
              <Input
                label="Lesson Title"
                value={currentLesson.title}
                onChange={(e) => setCurrentLesson(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Getting Started with JavaScript"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lesson Description
                </label>
                <textarea
                  value={currentLesson.description}
                  onChange={(e) => setCurrentLesson(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What will this lesson cover?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <Input
                label="Video URL"
                value={currentLesson.videoUrl}
                onChange={(e) => setCurrentLesson(prev => ({ ...prev, videoUrl: e.target.value }))}
                placeholder="https://youtube.com/watch?v=... or upload link"
              />

              <Input
                label="Duration"
                value={currentLesson.duration}
                onChange={(e) => setCurrentLesson(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 15 minutes"
              />

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPreview"
                  checked={currentLesson.isPreview}
                  onChange={(e) => setCurrentLesson(prev => ({ ...prev, isPreview: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isPreview" className="ml-2 text-sm text-gray-700">
                  Make this lesson a preview (free for all users)
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={editingLessonIndex >= 0 ? updateLesson : addLesson}
                className="flex-1"
              >
                {editingLessonIndex >= 0 ? 'Update' : 'Add'} Lesson
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowLessonForm(false);
                  setCurrentLesson({ title: '', description: '', videoUrl: '', duration: '', isPreview: false });
                  setEditingSectionIndex(-1);
                  setEditingLessonIndex(-1);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Save/Cancel Buttons */}
      <div className="flex space-x-4">
        <Button onClick={handleSave} className="flex-1">
          {isEditing ? 'Update Course' : 'Save Course'}
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default SkillContent;
