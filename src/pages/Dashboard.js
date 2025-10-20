import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { findPotentialMatches, createMatchRequest, getUserMatches, getUserNotifications, acceptMatchRequest, rejectMatchRequest, getAllPublicCourses, getConnectedUsersCourses } from '../firebase/services';
import { useProgress } from '../hooks/useProgress';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkillTag from '../components/ui/SkillTag';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Footer from '../components/Footer';
import LearningCard from '../components/ui/LearningCard';
import CourseViewer from '../components/ui/CourseViewer';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { courseRefreshService } from '../services/courseRefreshService';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const { getCourseProgress } = useProgress();
  const [matches, setMatches] = useState([]);
  const [connectedMatches, setConnectedMatches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [publicCourses, setPublicCourses] = useState([]);
  const [connectedUsersCourses, setConnectedUsersCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const navigate = useNavigate();

  const loadPublicCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const result = await getAllPublicCourses();
      
      if (result.success) {
        setPublicCourses(result.data || []);
      } else {
        console.error('Error loading courses:', result.error);
        setPublicCourses([]);
      }
    } catch (error) {
      console.error('Error loading public courses:', error);
      setPublicCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  // Real-time listener for public courses
  const setupPublicCoursesListener = useCallback(() => {
    if (!currentUser?.uid) return;

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, async (snapshot) => {
      try {
        const allCourses = [];
        
        snapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          if (userData.teachingCourses && Array.isArray(userData.teachingCourses)) {
            userData.teachingCourses.forEach((course) => {
              if (course.isPublic) {
                allCourses.push({
                  ...course,
                  instructorId: userDoc.id,
                  instructorName: userData.name || 'Unknown Instructor',
                  instructorTitle: userData.bio || 'Instructor'
                });
              }
            });
          }
        });
        
        // Sort by creation date (newest first)
        allCourses.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA;
        });
        
        setPublicCourses(allCourses);
        setCoursesLoading(false);
      } catch (error) {
        console.error('Error in public courses listener:', error);
        // Fallback to manual loading if listener fails
        loadPublicCourses();
      }
    }, (error) => {
      console.error('Firestore listener error:', error);
      // Fallback to manual loading if listener setup fails
      loadPublicCourses();
    });

    return unsubscribe;
  }, [currentUser?.uid, loadPublicCourses]);

  const loadConnectedUsersCourses = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      const result = await getConnectedUsersCourses(currentUser.uid);
      if (result.success) {
        setConnectedUsersCourses(result.data || []);
      } else {
        console.error('Failed to load connected users courses:', result.error);
        setConnectedUsersCourses([]);
      }
    } catch (error) {
      console.error('Error loading connected users courses:', error);
      setConnectedUsersCourses([]);
    }
  }, [currentUser?.uid]);

  // Real-time listener for connected users' courses
  const setupConnectedCoursesListener = useCallback(() => {
    if (!currentUser?.uid) return;

    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, async (snapshot) => {
      try {
        // First, get all matches for the current user
        const matchesResult = await getUserMatches(currentUser.uid);
        if (!matchesResult.success) {
          setConnectedUsersCourses([]);
          return;
        }
        
        const allMatches = matchesResult.data || [];
        const connectedMatches = allMatches.filter(match => match.status === 'connected');
        
        if (connectedMatches.length === 0) {
          setConnectedUsersCourses([]);
          return;
        }
        
        // Get all connected user IDs
        const connectedUserIds = connectedMatches.map(match => 
          match.requesterId === currentUser.uid ? match.targetUserId : match.requesterId
        );
        
        // Get courses from all connected users
        const allCourses = [];
        snapshot.forEach((userDoc) => {
          if (connectedUserIds.includes(userDoc.id)) {
            const userData = userDoc.data();
            const userCourses = userData.teachingCourses || [];
            
            // Add all courses (both public and private) from connected users
            userCourses.forEach(course => {
              allCourses.push({
                ...course,
                instructorId: userDoc.id,
                instructorName: userData.name || 'Unknown Instructor',
                instructorTitle: userData.bio || 'Instructor',
                isFromConnection: true // Mark as from connection
              });
            });
          }
        });
        
        // Sort by creation date (newest first)
        allCourses.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB - dateA;
        });
        
        setConnectedUsersCourses(allCourses);
      } catch (error) {
        console.error('Error in connected courses listener:', error);
        // Fallback to manual loading if listener fails
        loadConnectedUsersCourses();
      }
    }, (error) => {
      console.error('Firestore listener error for connected courses:', error);
      // Fallback to manual loading if listener setup fails
      loadConnectedUsersCourses();
    });

    return unsubscribe;
  }, [currentUser?.uid, loadConnectedUsersCourses]);

  const loadMatches = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load potential matches
      const matchesResult = await findPotentialMatches(currentUser.uid);
      if (matchesResult.success) {
        setMatches(matchesResult.data);
      } else {
        setError(matchesResult.error);
        console.error('Error loading matches:', matchesResult.error);
      }
      
      // Load connected matches
      const connectedResult = await getUserMatches(currentUser.uid);
      if (connectedResult.success) {
        const connected = connectedResult.data.filter(match => 
          match.status === 'connected' || match.status === 'in_session'
        );
        setConnectedMatches(connected);
      }
      
      // Load notifications (pending match requests)
      const notificationsResult = await getUserNotifications(currentUser.uid);
      if (notificationsResult.success) {
        setNotifications(notificationsResult.data);
      }
    } catch (error) {
      setError('Failed to load matches');
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser.uid]);

  // Manual refresh function for courses
  const refreshCourses = useCallback(() => {
    console.log('Manually refreshing courses...');
    // The real-time listeners will automatically update when data changes
    // This function is mainly for UI feedback
    setCoursesLoading(true);
    setTimeout(() => {
      setCoursesLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (currentUser && userProfile) {
      loadMatches();
      
      // Set up real-time listeners for courses
      const unsubscribePublicCourses = setupPublicCoursesListener();
      const unsubscribeConnectedCourses = setupConnectedCoursesListener();
      
      // Subscribe to manual refresh events
      const unsubscribeRefresh = courseRefreshService.subscribe(refreshCourses);
      
      // Fallback timeout to prevent infinite loading
      const fallbackTimeout = setTimeout(() => {
        if (coursesLoading) {
          console.log('Fallback: Loading courses manually due to timeout');
          loadPublicCourses();
          loadConnectedUsersCourses();
        }
      }, 10000); // 10 second timeout
      
      return () => {
        clearTimeout(fallbackTimeout);
        if (unsubscribePublicCourses) {
          unsubscribePublicCourses();
        }
        if (unsubscribeConnectedCourses) {
          unsubscribeConnectedCourses();
        }
        if (unsubscribeRefresh) {
          unsubscribeRefresh();
        }
      };
    }
  }, [currentUser, userProfile, loadMatches, setupPublicCoursesListener, setupConnectedCoursesListener, refreshCourses, coursesLoading, loadPublicCourses, loadConnectedUsersCourses]);

  const handleCreateMatch = async (matchedUserId) => {
    try {
      const result = await createMatchRequest(currentUser.uid, matchedUserId);
      
      if (result.success) {
        // Remove the match from the list since request is sent
        setMatches(prev => prev.filter(match => match.id !== matchedUserId));
        // Show success message
        setError('');
        alert('Match request sent! The other user will be notified and can accept or reject your request.');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to send match request');
      console.error('Error creating match request:', error);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleAcceptMatchRequest = async (notificationId) => {
    try {
      const result = await acceptMatchRequest(notificationId);
      
      if (result.success) {
        // Remove notification from list
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        // Reload matches to show the new connection
        loadMatches();
        alert('Match request accepted! You are now connected.');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to accept match request');
      console.error('Error accepting match request:', error);
    }
  };

  const handleRejectMatchRequest = async (notificationId) => {
    try {
      const result = await rejectMatchRequest(notificationId);
      
      if (result.success) {
        // Remove notification from list
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        alert('Match request rejected.');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to reject match request');
      console.error('Error rejecting match request:', error);
    }
  };

  const handleBookmark = (learningId) => {
    // This would typically update the user's bookmarks in the database
    console.log('Bookmarked learning:', learningId);
    // For now, just show a simple alert
    alert('Added to your bookmarks!');
  };


  if (loading) {
    console.log('Dashboard: Main loading state active');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  console.log('Dashboard: Rendering with', {
    publicCourses: publicCourses.length,
    connectedCourses: connectedUsersCourses.length,
    coursesLoading,
    matches: matches.length,
    notifications: notifications.length
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-3 animate-fade-in">
              Welcome back, <span className="text-gradient">{userProfile?.name}</span>!
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with amazing people and exchange skills in a collaborative learning environment
            </p>
          </div>

          {error && (
            <div className="mb-8 max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl animate-slide-up">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
              {error}
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {/* Connection Summary */}
          {(notifications.length > 0 || connectedMatches.length > 0) && (
            <div className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Connections</h2>
                <p className="text-gray-600">Manage your skill exchange connections</p>
                        </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {/* Match Requests */}
                <Card className="text-center animate-slide-up border-primary-200" style={{ animationDelay: '0ms' }}>
                  <div className="p-6">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Match Requests</h3>
                    <p className="text-3xl font-bold text-primary-600 mb-2">{notifications.length}</p>
                    <p className="text-sm text-gray-600 mb-4">People want to connect</p>
                      <Button
                      onClick={() => navigate('/connections?tab=requests')} 
                        variant="outline"
                        size="sm"
                      className="w-full"
                      >
                      Manage Requests
                      </Button>
                  </div>
                </Card>

                {/* Active Connections */}
                <Card className="text-center animate-slide-up border-primary-200" style={{ animationDelay: '100ms' }}>
                  <div className="p-6">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Connections</h3>
                    <p className="text-3xl font-bold text-primary-600 mb-2">{connectedMatches.length}</p>
                    <p className="text-sm text-gray-600 mb-4">Ready to learn together</p>
                      <Button
                      onClick={() => navigate('/connections?tab=connections')} 
                        variant="outline"
                        size="sm"
                      className="w-full"
                      >
                      View Connections
                      </Button>
                    </div>
                  </Card>

                {/* Available Courses */}
                <Card className="text-center animate-slide-up border-blue-200" style={{ animationDelay: '200ms' }}>
                  <div className="p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Courses</h3>
                        <p className="text-3xl font-bold text-blue-600 mb-2">{publicCourses.length}</p>
                        <p className="text-sm text-gray-600 mb-4">From the community</p>
                    <Button 
                      onClick={() => navigate('/browse')} 
                      size="sm" 
                      className="w-full"
                    >
                      Browse Courses
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Available Courses from Connections */}
          {connectedUsersCourses.length > 0 && (
            <div className="mb-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Courses from Your Connections
                </h2>
                <p className="text-gray-600">
                  Access full courses from people you're connected with
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectedUsersCourses.slice(0, 6).map((courseToShow, index) => (
                  <div key={courseToShow.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <Card className="cursor-pointer" onClick={() => setSelectedCourse(courseToShow)}>
                      <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                        {courseToShow.previewVideoUrl ? (
                          <div className="w-full h-full">
                            {courseToShow.previewVideoUrl.includes('youtube.com') || courseToShow.previewVideoUrl.includes('youtu.be') ? (
                              <iframe
                                src={courseToShow.previewVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                title={`${courseToShow.title} Preview`}
                                className="w-full h-full"
                                frameBorder="0"
                                allowFullScreen
                              />
                            ) : courseToShow.previewVideoUrl.includes('vimeo.com') ? (
                              <iframe
                                src={courseToShow.previewVideoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                                title={`${courseToShow.title} Preview`}
                                className="w-full h-full"
                                frameBorder="0"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={courseToShow.previewVideoUrl}
                                className="w-full h-full object-cover"
                                controls
                                muted
                                loop
                                playsInline
                              >
                                Your browser does not support the video tag.
                              </video>
                            )}
                          </div>
                        ) : courseToShow.thumbnailUrl ? (
                          <img src={courseToShow.thumbnailUrl} alt={courseToShow.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                            <p className="text-primary-700 font-medium text-sm">Full Course Access</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-start space-x-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {courseToShow.instructorName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{courseToShow.instructorName}</p>
                          <p className="text-xs text-gray-500">Your Connection</p>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{courseToShow.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{courseToShow.description}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs">
                          {courseToShow.level}
                        </span>
                        <span>{courseToShow.duration}</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-primary-600 font-medium">Available Now</span>
                          <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                            Start Learning
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured Learning Section */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Featured Learning Content
              </h2>
              <p className="text-gray-600">
                Discover amazing skills to learn from our community
              </p>
            </div>
            
            {coursesLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : publicCourses.length === 0 ? (
              <Card className="max-w-2xl mx-auto">
                <div className="text-center py-16">
                  <div className="mx-auto h-20 w-20 text-gray-300 mb-6">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No courses available yet</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">Be the first to create a course and share your knowledge with the community!</p>
                  <Button onClick={() => navigate('/profile?tab=teaching')} size="lg">
                    Create Your First Course
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {publicCourses.slice(0, 8).map((course, index) => (
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
                    style={{ animationDelay: `${index * 100}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Potential Matches Section */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Discover New Connections
            </h2>
            <p className="text-gray-600">
              Find people who share your learning interests
            </p>
          </div>

          {matches.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <div className="text-center py-16">
                <div className="mx-auto h-20 w-20 text-gray-300 mb-6">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No new matches found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Try updating your skills in your profile to find better matches and expand your learning network.
                </p>
                <Button onClick={() => navigate('/profile')} size="lg">
                    Update Profile
                  </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((match, index) => (
                <Card key={match.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="flex-shrink-0">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-sm">
                        <span className="text-primary-700 font-bold text-lg">
                          {match.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                        {match.name}
                      </h3>
                      <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-3">
                        {match.matchScore}% match
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Skills they can teach you */}
                    {match.commonSkillsHave.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                          <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                          Can teach you:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {match.commonSkillsHave.map((skill, skillIndex) => (
                            <SkillTag
                              key={skillIndex}
                              skill={skill}
                              variant="primary"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills you can teach them */}
                    {match.commonSkillsToLearn.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                          <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                          Wants to learn from you:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {match.commonSkillsToLearn.map((skill, skillIndex) => (
                            <SkillTag
                              key={skillIndex}
                              skill={skill}
                              variant="success"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProfile(match.id)}
                      className="flex-1"
                    >
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCreateMatch(match.id)}
                      className="flex-1"
                    >
                      Connect
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
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

export default Dashboard;
