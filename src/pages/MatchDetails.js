import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateMatchStatus, getUserMatches, startLearningSession } from '../firebase/services';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkillTag from '../components/ui/SkillTag';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';

const MatchDetails = () => {
  const { matchId } = useParams();
  const { currentUser } = useAuth();
  const [match, setMatch] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedSessionMode, setSelectedSessionMode] = useState('');
  const navigate = useNavigate();

  const loadMatchDetails = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get user's matches to find the specific match
      const matchesResult = await getUserMatches(currentUser.uid);
      
      if (matchesResult.success) {
        const foundMatch = matchesResult.data.find(m => m.id === matchId);
        
        if (foundMatch) {
          setMatch(foundMatch);
          
          // Get the other user's profile
          const otherUserId = foundMatch.users.find(uid => uid !== currentUser.uid);
          if (otherUserId) {
            const userResult = await getUserProfile(otherUserId);
            if (userResult.success) {
              setOtherUser(userResult.data);
            } else {
              setError('Failed to load user profile');
            }
          }
        } else {
          setError('Match not found');
        }
      } else {
        setError(matchesResult.error);
      }
    } catch (error) {
      setError('Failed to load match details');
      console.error('Error loading match details:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser.uid, matchId]);

  useEffect(() => {
    if (matchId && currentUser) {
      loadMatchDetails();
    }
  }, [matchId, currentUser, loadMatchDetails]);

  const handleAcceptMatch = async () => {
    try {
      setUpdating(true);
      const result = await updateMatchStatus(matchId, 'accepted');
      
      if (result.success) {
        setMatch(prev => ({ ...prev, status: 'accepted' }));
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to accept match');
      console.error('Error accepting match:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRejectMatch = async () => {
    try {
      setUpdating(true);
      const result = await updateMatchStatus(matchId, 'rejected');
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to reject match');
      console.error('Error rejecting match:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleStartLearning = () => {
    setShowSessionModal(true);
  };

  const handleSessionModeSelect = async (mode) => {
    try {
      setUpdating(true);
      setSelectedSessionMode(mode);
      
      const result = await startLearningSession(matchId, mode);
      
      if (result.success) {
        setShowSessionModal(false);
        navigate(`/learning/${matchId}?mode=${mode}`);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to start learning session');
      console.error('Error starting learning session:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseModal = () => {
    setShowSessionModal(false);
    setSelectedSessionMode('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !match || !otherUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Match not found</h2>
          <p className="mt-2 text-gray-600">{error || 'The match you\'re looking for doesn\'t exist.'}</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="mb-4"
            >
              ← Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Match with {otherUser.name}
            </h1>
            <p className="mt-2 text-gray-600">
              Status: <span className={`font-medium ${
                match.status === 'connected' ? 'text-green-600' : 
                match.status === 'in_session' ? 'text-blue-600' :
                match.status === 'accepted' ? 'text-green-600' : 
                match.status === 'rejected' ? 'text-red-600' : 
                'text-yellow-600'
              }`}>
                {match.status === 'connected' ? 'Connected' :
                 match.status === 'in_session' ? 'In Session' :
                 match.status.charAt(0).toUpperCase() + match.status.slice(1)}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Other User's Profile */}
            <Card>
              <Card.Header>
                <Card.Title>{otherUser.name}'s Profile</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-2xl">
                      {otherUser.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {otherUser.name}
                    </h3>
                    {otherUser.location && (
                      <p className="text-gray-600">📍 {otherUser.location}</p>
                    )}
                  </div>
                </div>

                {otherUser.bio && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
                    <p className="text-gray-600">{otherUser.bio}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills they have</h4>
                    <div className="flex flex-wrap gap-2">
                      {otherUser.skillsHave?.map((skill, index) => (
                        <SkillTag
                          key={index}
                          skill={skill}
                          variant="primary"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills they want to learn</h4>
                    <div className="flex flex-wrap gap-2">
                      {otherUser.skillsToLearn?.map((skill, index) => (
                        <SkillTag
                          key={index}
                          skill={skill}
                          variant="success"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Match Actions */}
            <Card>
              <Card.Header>
                <Card.Title>Match Actions</Card.Title>
              </Card.Header>
              <Card.Content>
                {match.status === 'pending' && (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      You have a pending match with {otherUser.name}. 
                      Review their profile and decide if you'd like to accept this match.
                    </p>
                    
                    <div className="flex space-x-4">
                      <Button
                        onClick={handleAcceptMatch}
                        loading={updating}
                        disabled={updating}
                        className="flex-1"
                      >
                        Accept Match
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleRejectMatch}
                        loading={updating}
                        disabled={updating}
                        className="flex-1"
                      >
                        Reject Match
                      </Button>
                    </div>
                  </div>
                )}

                {(match.status === 'accepted' || match.status === 'connected') && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800">
                            {match.status === 'connected' ? 'Connected!' : 'Match Accepted!'}
                          </h3>
                          <div className="mt-2 text-sm text-green-700">
                            <p>
                              {match.status === 'connected' 
                                ? `You and ${otherUser.name} are connected! You can start learning sessions anytime.`
                                : `You and ${otherUser.name} have accepted this match. You can now start learning together!`
                              }
                            </p>
                            {match.lastLearningSession && (
                              <p className="mt-1 text-xs text-green-600">
                                Last session: {match.lastLearningSession.toDate?.()?.toLocaleDateString() || 'Recently'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleStartLearning}
                      className="w-full"
                      loading={updating}
                      disabled={updating}
                    >
                      {match.status === 'connected' ? 'Start New Session' : 'Start Learning Session'}
                    </Button>
                  </div>
                )}

                {match.status === 'in_session' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Learning Session Active
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>You and {otherUser.name} are currently in a learning session.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => navigate(`/learning/${matchId}`)}
                      className="w-full"
                    >
                      Join Learning Session
                    </Button>
                  </div>
                )}

                {match.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Match Rejected
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>This match has been rejected.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>

      {/* Session Mode Selection Modal */}
      <Modal
        isOpen={showSessionModal}
        onClose={handleCloseModal}
        title="Choose Session Type"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            How would you like to start your learning session with {otherUser?.name}?
          </p>
          
          <div className="space-y-3">
            {/* Webcam Session Option */}
            <div 
              className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors"
              onClick={() => handleSessionModeSelect('webcam')}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">Video Call Session</h4>
                  <p className="text-sm text-gray-500">Face-to-face video call with text chat and screen sharing</p>
                </div>
                {selectedSessionMode === 'webcam' && (
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Session Option */}
            <div 
              className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors"
              onClick={() => handleSessionModeSelect('chat')}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">Text Chat Session</h4>
                  <p className="text-sm text-gray-500">Text-only chat for written communication and file sharing</p>
                </div>
                {selectedSessionMode === 'chat' && (
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Document Sharing Session Option */}
            <div 
              className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors"
              onClick={() => handleSessionModeSelect('document')}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">Document Collaboration</h4>
                  <p className="text-sm text-gray-500">Upload and collaborate on documents with text chat support</p>
                </div>
                {selectedSessionMode === 'document' && (
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="flex-1"
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSessionModeSelect(selectedSessionMode)}
              className="flex-1"
              disabled={!selectedSessionMode || updating}
              loading={updating}
            >
              Start Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MatchDetails;
