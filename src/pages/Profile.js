import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../firebase/services';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SkillTag from '../components/ui/SkillTag';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SkillContent from '../components/ui/SkillContent';
import Footer from '../components/Footer';
import { courseRefreshService } from '../services/courseRefreshService';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

const Profile = () => {
  const { userId } = useParams();
  const location = useLocation();
  const { currentUser, userProfile, updateUserProfile: updateProfile, refreshUserProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    skillsHave: [],
    skillsToLearn: []
  });
  const [skillInput, setSkillInput] = useState('');
  const [skillToLearnInput, setSkillToLearnInput] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('tab') || 'profile';
  }); // 'profile', 'teaching', 'courses'
  const [teachingCourses, setTeachingCourses] = useState([]);
  const [showSkillContentForm, setShowSkillContentForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const navigate = useNavigate();

  const isOwnProfile = !userId || userId === currentUser?.uid;
  const targetUserId = userId || currentUser?.uid;

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getUserProfile(targetUserId);
      
      if (result.success) {
        setProfile(result.data);
        if (isOwnProfile) {
          setFormData({
            name: result.data.name || '',
            bio: result.data.bio || '',
            location: result.data.location || '',
            skillsHave: result.data.skillsHave || [],
            skillsToLearn: result.data.skillsToLearn || []
          });
          const courses = result.data.teachingCourses || [];
          console.log('Loading teaching courses:', courses.length, 'courses');
          setTeachingCourses(courses);
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to load profile');
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, isOwnProfile]);

  // Real-time listener for user profile (including teaching courses)
  const setupProfileListener = useCallback(() => {
    if (!targetUserId) return;

    const userRef = doc(db, 'users', targetUserId);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      try {
        if (doc.exists()) {
          const userData = doc.data();
          setProfile(userData);
          
          if (isOwnProfile) {
            setFormData({
              name: userData.name || '',
              bio: userData.bio || '',
              location: userData.location || '',
              skillsHave: userData.skillsHave || [],
              skillsToLearn: userData.skillsToLearn || []
            });
            
            const courses = userData.teachingCourses || [];
            console.log('Real-time update: teaching courses:', courses.length, 'courses');
            setTeachingCourses(courses);
          }
          
          setLoading(false);
        } else {
          setError('Profile not found');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in profile listener:', error);
        setError('Failed to load profile');
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [targetUserId, isOwnProfile]);

  useEffect(() => {
    if (isOwnProfile && userProfile) {
      // For own profile, use the real-time listener to get fresh data
      const unsubscribe = setupProfileListener();
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } else if (targetUserId) {
      // For other users' profiles, use manual loading
      loadProfile();
    }
  }, [userId, userProfile, isOwnProfile, targetUserId, loadProfile, setupProfileListener]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const addSkill = (skill, type) => {
    if (!skill.trim()) return;
    
    const skillList = skill.trim().toLowerCase();
    if (type === 'have' && !formData.skillsHave.includes(skillList)) {
      setFormData(prev => ({
        ...prev,
        skillsHave: [...prev.skillsHave, skillList]
      }));
      setSkillInput('');
    } else if (type === 'learn' && !formData.skillsToLearn.includes(skillList)) {
      setFormData(prev => ({
        ...prev,
        skillsToLearn: [...prev.skillsToLearn, skillList]
      }));
      setSkillToLearnInput('');
    }
  };

  const removeSkill = (skill, type) => {
    if (type === 'have') {
      setFormData(prev => ({
        ...prev,
        skillsHave: prev.skillsHave.filter(s => s !== skill)
      }));
    } else if (type === 'learn') {
      setFormData(prev => ({
        ...prev,
        skillsToLearn: prev.skillsToLearn.filter(s => s !== skill)
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      if (formData.skillsHave.length === 0 || formData.skillsToLearn.length === 0) {
        setError('Please add at least one skill you have and one skill you want to learn');
        setSaving(false);
        return;
      }

      const result = await updateProfile(currentUser.uid, formData);
      
      if (result.success) {
        setProfile(prev => ({ ...prev, ...formData }));
        setEditing(false);
        // Refresh the user profile to ensure navbar and dashboard are updated
        await refreshUserProfile();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      skillsHave: profile?.skillsHave || [],
      skillsToLearn: profile?.skillsToLearn || []
    });
    setEditing(false);
    setError('');
  };

  const handleSaveSkillContent = async (courseData) => {
    try {
      setSaving(true);
      // Clean the course data - remove File objects and convert to URLs
      const cleanedCourseData = {
        title: courseData.title || '',
        description: courseData.description || '',
        level: courseData.level || 'Beginner',
        duration: courseData.duration || '',
        tags: courseData.tags || [],
        sections: courseData.sections || [],
        price: courseData.price || 0,
        isPublic: courseData.isPublic || false,
        // Remove File objects - we'll handle file uploads separately later
        previewVideoUrl: courseData.previewVideoUrl || '',
        thumbnailUrl: courseData.thumbnailUrl || ''
      };
      
      // Create new course object
      const newCourse = {
        ...cleanedCourseData,
        id: editingCourse?.id || Date.now(),
        instructorId: currentUser.uid,
        instructorName: profile?.name || currentUser.email,
        instructorTitle: profile?.bio || '',
        createdAt: editingCourse?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      let updatedCourses;
      if (editingCourse) {
        // Update existing course
        updatedCourses = teachingCourses.map(course => 
          course.id === editingCourse.id ? newCourse : course
        );
      } else {
        // Add new course
        updatedCourses = [...teachingCourses, newCourse];
      }

      // Update profile with new course data
      console.log('Saving teaching courses to Firestore, count:', updatedCourses.length);
      console.log('Course data:', updatedCourses);
      
      const result = await updateProfile(currentUser.uid, {
        teachingCourses: updatedCourses
      });

      if (result.success) {
        console.log('Course saved to Firestore successfully!');
        
        // Update local state AFTER successful save
        setTeachingCourses(updatedCourses);
        console.log('Local state updated with', updatedCourses.length, 'courses');
        
        // Trigger course refresh in Dashboard and other components
        courseRefreshService.triggerRefresh();
        
        alert('Course saved successfully!'); // Temporary alert for feedback
        setShowSkillContentForm(false);
        setEditingCourse(null);
        setError('');
      } else {
        console.error('Failed to save course to Firestore:', result.error);
        alert('Failed to save course: ' + (result.error || 'Unknown error'));
        setError(result.error || 'Failed to save course');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      if (error.message && error.message.includes('File object')) {
        setError('Please try saving again. File upload issue detected.');
      } else {
        setError('Failed to save course: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setShowSkillContentForm(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const updatedCourses = teachingCourses.filter(course => course.id !== courseId);
        setTeachingCourses(updatedCourses);

        const result = await updateProfile(currentUser.uid, {
          teachingCourses: updatedCourses
        });

        if (!result.success) {
          setError(result.error || 'Failed to delete course');
        } else {
          // Trigger course refresh in Dashboard and other components
          courseRefreshService.triggerRefresh();
        }
      } catch (error) {
        setError('Failed to delete course');
        console.error('Error deleting course:', error);
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (isOwnProfile) {
      const newUrl = tab === 'profile' ? '/profile' : `/profile?tab=${tab}`;
      navigate(newUrl, { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
          <p className="mt-2 text-gray-600">The user profile you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                {isOwnProfile ? 'My Profile' : `${profile.name}'s Profile`}
              </h1>
              {isOwnProfile && activeTab === 'profile' && (
                <Button
                  variant={editing ? 'secondary' : 'primary'}
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? 'Cancel' : 'Edit Profile'}
                </Button>
              )}
            </div>
          </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Tabs */}
        {isOwnProfile && (
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => handleTabChange('profile')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => handleTabChange('teaching')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'teaching'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Teaching Courses
                </button>
                <button
                  onClick={() => handleTabChange('courses')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'courses'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  My Learning
                </button>
              </nav>
            </div>
          </div>
        )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info */}
            <div className="lg:col-span-1">
              <Card>
                <div className="text-center">
                  <div className="mx-auto h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                    <span className="text-primary-600 font-bold text-3xl">
                      {profile.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {editing ? (
                    <Input
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mb-4"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {profile.name}
                    </h2>
                  )}

                  {editing ? (
                    <Input
                      label="Location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Enter your location"
                      className="mb-4"
                    />
                  ) : (
                    profile.location && (
                      <p className="text-gray-600 mb-4">
                        📍 {profile.location}
                      </p>
                    )
                  )}

                  {editing ? (
                    <div className="text-left">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={4}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  ) : (
                    profile.bio && (
                      <p className="text-gray-700 text-left">
                        {profile.bio}
                      </p>
                    )
                  )}
                </div>
              </Card>
            </div>

            {/* Skills */}
            <div className="lg:col-span-2 space-y-6">
              {/* Skills I Have */}
              <Card>
                <Card.Header>
                  <Card.Title>Skills I Have</Card.Title>
                </Card.Header>
                <Card.Content>
                  {editing ? (
                    <div>
                      <div className="flex space-x-2 mb-4">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput, 'have'))}
                          placeholder="Add a skill"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addSkill(skillInput, 'have')}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.skillsHave.map((skill, index) => (
                          <SkillTag
                            key={index}
                            skill={skill}
                            variant="primary"
                            removable
                            onRemove={(skill) => removeSkill(skill, 'have')}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.skillsHave?.map((skill, index) => (
                        <SkillTag
                          key={index}
                          skill={skill}
                          variant="primary"
                        />
                      ))}
                    </div>
                  )}
                </Card.Content>
              </Card>

              {/* Skills I Want to Learn */}
              <Card>
                <Card.Header>
                  <Card.Title>Skills I Want to Learn</Card.Title>
                </Card.Header>
                <Card.Content>
                  {editing ? (
                    <div>
                      <div className="flex space-x-2 mb-4">
                        <input
                          type="text"
                          value={skillToLearnInput}
                          onChange={(e) => setSkillToLearnInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillToLearnInput, 'learn'))}
                          placeholder="Add a skill to learn"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addSkill(skillToLearnInput, 'learn')}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.skillsToLearn.map((skill, index) => (
                          <SkillTag
                            key={index}
                            skill={skill}
                            variant="success"
                            removable
                            onRemove={(skill) => removeSkill(skill, 'learn')}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.skillsToLearn?.map((skill, index) => (
                        <SkillTag
                          key={index}
                          skill={skill}
                          variant="success"
                        />
                      ))}
                    </div>
                  )}
                </Card.Content>
              </Card>

              {editing && (
                <div className="flex space-x-4">
                  <Button
                    onClick={handleSave}
                    loading={saving}
                    disabled={saving}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teaching Courses Tab */}
        {activeTab === 'teaching' && isOwnProfile && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Teaching Courses</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {teachingCourses.length} {teachingCourses.length === 1 ? 'course' : 'courses'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { setShowSkillContentForm(true); setEditingCourse(null); }}>
                  Create New Course
                </Button>
              </div>
            </div>

            {showSkillContentForm && (
              <Card className="mb-6">
                <Card.Header>
                  <Card.Title>{editingCourse ? 'Edit Course' : 'Create New Course'}</Card.Title>
                </Card.Header>
                <Card.Content>
                  <SkillContent
                    skillContent={editingCourse}
                    onSave={handleSaveSkillContent}
                    onCancel={() => { setShowSkillContentForm(false); setEditingCourse(null); }}
                    isEditing={!!editingCourse}
                  />
                </Card.Content>
              </Card>
            )}

            {teachingCourses.length === 0 && !showSkillContentForm && (
              <Card>
                <div className="text-center py-12">
                  <div className="mx-auto h-20 w-20 text-gray-300 mb-6">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No courses created yet</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">Start sharing your knowledge by creating your first course. Help others learn and grow!</p>
                  <Button onClick={() => setShowSkillContentForm(true)} size="lg">
                    Create Your First Course
                  </Button>
                </div>
              </Card>
            )}

            {loading && !showSkillContentForm ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : null}
            
            {!loading && teachingCourses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachingCourses.map((course, index) => (
                  <Card key={course.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {course.thumbnailUrl ? (
                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          <p className="text-primary-700 font-medium text-sm">Course Preview</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{course.description}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          course.level === 'Beginner' ? 'bg-primary-100 text-primary-700' :
                          course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          course.level === 'Advanced' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {course.level}
                        </span>
                        <span>{course.duration}</span>
                      </div>

                      {course.tags && course.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {course.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                          {course.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{course.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          course.isPublic ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {course.isPublic ? 'Public' : 'Private'}
                        </span>
                        <span className="text-gray-500">
                          {course.sections?.length || 0} sections
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditCourse(course)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="danger" 
                        onClick={() => handleDeleteCourse(course.id)}
                        className="flex-1"
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Learning Tab */}
        {activeTab === 'courses' && isOwnProfile && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">My Learning</h2>
              <p className="text-gray-600">Courses you're learning from other instructors</p>
            </div>

            <Card>
              <div className="text-center py-12">
                <div className="mx-auto h-20 w-20 text-gray-300 mb-6">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No courses in progress</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">Start learning by browsing courses from other instructors and connecting with them for skill exchange.</p>
                <Button onClick={() => navigate('/browse')} size="lg">
                  Browse Courses
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
