import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserMatches, getUserNotifications, acceptMatchRequest, rejectMatchRequest, findPotentialMatches, createMatchRequest } from '../firebase/services';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkillTag from '../components/ui/SkillTag';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Footer from '../components/Footer';

const Connections = () => {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  const [matches, setMatches] = useState([]);
  const [connectedMatches, setConnectedMatches] = useState([]);
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('tab') || 'requests';
  }); // 'requests', 'connections', 'discover'
  const navigate = useNavigate();

  const loadMatches = useCallback(async () => {
    if (!currentUser?.uid) return;
    
    try {
      const [matchesResult, notificationsResult, potentialMatchesResult] = await Promise.all([
        getUserMatches(currentUser.uid),
        getUserNotifications(currentUser.uid),
        findPotentialMatches(currentUser.uid)
      ]);

      if (matchesResult.success) {
        const allMatches = matchesResult.data || [];
        setMatches(allMatches.filter(match => match.status === 'pending'));
        setConnectedMatches(allMatches.filter(match => match.status === 'connected'));
      } else {
        // Set empty arrays if no matches found
        setMatches([]);
        setConnectedMatches([]);
      }

      if (notificationsResult.success) {
        setNotifications(notificationsResult.data || []);
      } else {
        // Set empty array if no notifications found
        setNotifications([]);
      }

      if (potentialMatchesResult.success) {
        setPotentialMatches(potentialMatchesResult.data || []);
      } else {
        // Set empty array if no potential matches found
        setPotentialMatches([]);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      setError('Failed to load connections');
      // Initialize arrays to prevent undefined errors
      setMatches([]);
      setConnectedMatches([]);
      setPotentialMatches([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleAcceptMatchRequest = async (notificationId) => {
    try {
      const result = await acceptMatchRequest(notificationId);
      
      if (result.success) {
        // Remove notification from list
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        // Reload matches to update connection status
        await loadMatches();
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
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to reject match request');
      console.error('Error rejecting match request:', error);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleStartSession = (matchId) => {
    navigate(`/match/${matchId}`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newUrl = tab === 'requests' ? '/connections' : `/connections?tab=${tab}`;
    navigate(newUrl, { replace: true });
  };

  const handleCreateMatchRequest = async (matchedUserId) => {
    try {
      setError('');
      const result = await createMatchRequest(currentUser.uid, matchedUserId);
      if (result.success) {
        alert('Match request sent!');
        // Remove the user from potential matches since we've sent a request
        setPotentialMatches(prev => prev.filter(match => match.id !== matchedUserId));
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to send match request');
      console.error('Error creating match request:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Connections</h1>
          <p className="text-gray-600">Manage your skill exchange connections and requests</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-slide-up">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => handleTabChange('requests')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'requests'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Match Requests
                  {notifications && notifications.length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {notifications.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('connections')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'connections'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Active Connections
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {connectedMatches ? connectedMatches.length : 0}
                  </span>
                </button>
                <button
                  onClick={() => handleTabChange('discover')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'discover'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Discover New Matches
                </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'requests' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Match Requests</h2>
              <p className="text-gray-600">People who want to connect with you for skill exchange</p>
            </div>

            {!notifications || notifications.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600">You don't have any match requests at the moment.</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notifications && notifications.map((notification, index) => (
                  <Card key={notification.id} className="animate-slide-up border-primary-200" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="flex-shrink-0">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-sm">
                          <span className="text-primary-700 font-bold text-lg">
                            {notification.requesterName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                          {notification.requesterName || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-primary-600 font-medium mb-2">Wants to connect with you</p>
                        <p className="text-xs text-gray-500 mb-3">
                          {notification.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                        </p>
                        {notification.requesterSkills && notification.requesterSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {notification.requesterSkills.slice(0, 3).map((skill, skillIndex) => (
                              <span key={skillIndex} className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                                {skill}
                              </span>
                            ))}
                            {notification.requesterSkills.length > 3 && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{notification.requesterSkills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm" onClick={() => handleViewProfile(notification.requesterId)} className="flex-1">
                        View Profile
                      </Button>
                      <Button variant="success" size="sm" onClick={() => handleAcceptMatchRequest(notification.id)} className="flex-1">
                        Accept
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleRejectMatchRequest(notification.id)} className="flex-1">
                        Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'connections' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Active Connections</h2>
              <p className="text-gray-600">People you're connected with for skill exchange</p>
            </div>

            {!connectedMatches || connectedMatches.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active connections</h3>
                  <p className="text-gray-600">Start connecting with people to exchange skills!</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectedMatches && connectedMatches.map((match, index) => (
                  <Card key={match.id} className="animate-slide-up border-primary-200" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="flex items-start space-x-4 mb-6">
                      <div className="flex-shrink-0">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-sm">
                          <span className="text-primary-700 font-bold text-lg">
                            {match.otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                          {match.otherUser?.name || 'Unknown User'}
                        </h3>
                        <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-3">
                          {match.status === 'in_session' ? 'In Session' : 'Connected'}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm" onClick={() => handleViewProfile(match.otherUser?.id)} className="flex-1">
                        View Profile
                      </Button>
                      <Button size="sm" onClick={() => handleStartSession(match.id)} className="flex-1">
                        {match.status === 'in_session' ? 'Join Session' : 'Start Session'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Discover New Matches</h2>
              <p className="text-gray-600">Find people with complementary skills to connect with</p>
            </div>

            {!potentialMatches || potentialMatches.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No new matches found</h3>
                  <p className="text-gray-600 mb-6">Try updating your skills in your profile to find better matches.</p>
                  <Button onClick={() => navigate('/profile')}>
                    Update Profile
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {potentialMatches && potentialMatches.map((match, index) => (
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
                        <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">{match.name}</h3>
                        <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium mb-3">
                          {match.matchScore}% match
                        </div>
                      </div>
                    </div>
                    <div className="space-y-5">
                      {match.commonSkillsHave.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                            Can teach you:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {match.commonSkillsHave.map((skill, skillIndex) => (
                              <SkillTag key={skillIndex} skill={skill} variant="primary" />
                            ))}
                          </div>
                        </div>
                      )}
                      {match.commonSkillsToLearn.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="h-2 w-2 bg-primary-500 rounded-full mr-2"></span>
                            Wants to learn from you:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {match.commonSkillsToLearn.map((skill, skillIndex) => (
                              <SkillTag key={skillIndex} skill={skill} variant="success" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex space-x-3">
                      <Button variant="outline" size="sm" onClick={() => handleViewProfile(match.id)} className="flex-1">
                        View Profile
                      </Button>
                      <Button size="sm" onClick={() => handleCreateMatchRequest(match.id)} className="flex-1">
                        Connect
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Connections;
