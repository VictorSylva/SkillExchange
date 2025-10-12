import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, getUserMatches, sendMessage, getMessages, endLearningSession, uploadFile } from '../firebase/services';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Learning = () => {
  const { matchId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionMode = searchParams.get('mode') || 'chat';
  const { currentUser } = useAuth();
  const [match, setMatch] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // Feature selection states
  const [showVideo, setShowVideo] = useState(false);
  const [showChat, setShowChat] = useState(true); // Chat is default
  const [showFileUpload, setShowFileUpload] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const messagesEndRef = useRef(null);
  const localStreamRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ setupVideoCall moved up and wrapped in useCallback
  const setupVideoCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // For now, we'll show a placeholder for the remote video
      // In a full implementation, you'd use WebRTC to connect peers
      console.log('Video call setup initiated - Local stream ready');
    } catch (error) {
      console.error('Error setting up video call:', error);
      setError('Failed to access camera/microphone. Please check permissions.');
    }
  }, []);

  const loadMatchDetails = useCallback(async () => {
    try {
      setLoading(true);
      const matchesResult = await getUserMatches(currentUser.uid);
      
      if (matchesResult.success) {
        const foundMatch = matchesResult.data.find(m => m.id === matchId);
        
        if (foundMatch && (foundMatch.status === 'accepted' || foundMatch.status === 'connected' || foundMatch.status === 'in_session')) {
          setMatch(foundMatch);
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
          setError('Match not found or not accepted');
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

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [matchId, currentUser, loadMatchDetails]);

  // Setup video call when showVideo is enabled
  useEffect(() => {
    if (showVideo && matchId && currentUser) {
      setupVideoCall();
    }
  }, [showVideo, matchId, currentUser, setupVideoCall]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      const result = await sendMessage(matchId, currentUser.uid, newMessage.trim());
      
      if (result.success) {
        setNewMessage('');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to send message');
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEndSession = async () => {
    try {
      setEndingSession(true);
      const result = await endLearningSession(matchId);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to end session');
      console.error('Error ending session:', error);
    } finally {
      setEndingSession(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) {
      console.log('No files provided to upload');
      return;
    }

    console.log('Starting file upload process...', files);
    console.log('Current matchId:', matchId);
    console.log('Current user:', currentUser?.uid);

    if (!matchId || !currentUser?.uid) {
      console.error('Missing matchId or currentUser');
      setError('Cannot upload file: Missing session information');
      return;
    }

    try {
      setUploadingFile(true);
      setError(''); // Clear any previous errors
      
      for (const file of files) {
        console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }
        
        // Create a unique file path
        const filePath = `learning-sessions/${matchId}/${Date.now()}-${file.name}`;
        console.log('File path:', filePath);
        
        // Upload file to Firebase Storage with timeout
        const uploadPromise = uploadFile(file, filePath);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout')), 30000)
        );
        
        const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
        console.log('Upload result:', uploadResult);
        
        if (uploadResult.success) {
          const fileData = {
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type,
            uploadedAt: new Date(),
            uploadedBy: currentUser.uid,
            downloadURL: uploadResult.downloadURL,
            filePath: filePath
          };
          
          // Send file info as a message to notify the other user
          try {
            await sendMessage(matchId, currentUser.uid, `📎 Shared file: ${file.name}`, 'file');
            console.log('File notification sent to chat');
          } catch (chatError) {
            console.error('Failed to send file notification:', chatError);
            // Don't fail the upload if chat fails
          }
          
          setUploadedFiles(prev => [...prev, fileData]);
          console.log('File uploaded successfully:', fileData);
        } else {
          console.error('Upload failed:', uploadResult.error);
          setError(`Failed to upload ${file.name}: ${uploadResult.error}`);
        }
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError('Failed to upload file: ' + error.message);
    } finally {
      setUploadingFile(false);
      console.log('Upload process completed');
    }
  };

  const handleFileInputChange = (event) => {
    console.log('File input changed:', event.target.files);
    const files = Array.from(event.target.files);
    console.log('Files selected:', files);
    handleFileUpload(files);
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const handleChooseFilesClick = () => {
    console.log('Choose files button clicked');
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.click();
    } else {
      console.error('File input not found');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    console.log('Files dropped:', files);
    handleFileUpload(files);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (matchId) {
      const unsubscribe = getMessages(matchId, (snapshot) => {
        const messageList = [];
        snapshot.forEach((doc) => {
          messageList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setMessages(messageList);
      });

      return unsubscribe;
    }
  }, [matchId]);

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
          <h2 className="text-2xl font-bold text-gray-900">Learning session not available</h2>
          <p className="mt-2 text-gray-600">{error || 'The learning session you\'re looking for doesn\'t exist.'}</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="mb-4"
            >
              ← Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Learning Session with {otherUser.name}
            </h1>
            <p className="mt-2 text-gray-600">
              Full Learning Session with Video, Chat & File Sharing
            </p>
          </div>

          {/* Feature Selection */}
          <div className="mb-6">
            <Card>
              <Card.Header>
                <Card.Title>Choose Learning Features</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Video Call Option */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      showVideo 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setShowVideo(!showVideo)}
                  >
                    <div className="text-center">
                      <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Video Call</h3>
                      <p className="text-sm text-gray-600 mb-3">Face-to-face video communication</p>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        showVideo 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {showVideo ? '✓ Enabled' : 'Click to Enable'}
                      </div>
                    </div>
                  </div>

                  {/* Chat Option */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      showChat 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => setShowChat(!showChat)}
                  >
                    <div className="text-center">
                      <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Chat</h3>
                      <p className="text-sm text-gray-600 mb-3">Real-time text messaging</p>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        showChat 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {showChat ? '✓ Enabled' : 'Click to Enable'}
                      </div>
                    </div>
                  </div>

                  {/* File Upload Option */}
                  <div 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      showFileUpload 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => setShowFileUpload(!showFileUpload)}
                  >
                    <div className="text-center">
                      <div className="mx-auto h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">File Sharing</h3>
                      <p className="text-sm text-gray-600 mb-3">Upload and share documents</p>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        showFileUpload 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {showFileUpload ? '✓ Enabled' : 'Click to Enable'}
                      </div>
                    </div>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Video Call Section - Only when enabled */}
          {showVideo && (
            <div className="mb-6">
              <Card>
                <Card.Header>
                  <Card.Title>Video Call</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
                    <div className="aspect-video bg-gray-800 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="h-16 w-16 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl font-bold">
                            {otherUser.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-lg font-medium">{otherUser.name}</p>
                        <p className="text-sm text-gray-400">Video call ready - WebRTC connection needed</p>
                      </div>
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="hidden w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant={audioEnabled ? 'primary' : 'secondary'}
                      onClick={toggleAudio}
                      size="sm"
                    >
                      {audioEnabled ? '🔊' : '🔇'} Audio
                    </Button>
                    <Button
                      variant={videoEnabled ? 'primary' : 'secondary'}
                      onClick={toggleVideo}
                      size="sm"
                    >
                      {videoEnabled ? '📹' : '📷'} Video
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleEndSession}
                      loading={endingSession}
                      disabled={endingSession}
                    >
                      📞 End Session
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            </div>
          )}

          {/* Chat and File Sharing - Only when enabled */}
          {(showChat || showFileUpload) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chat Section - Only when enabled */}
              {showChat && (
                <Card className="h-full flex flex-col">
                  <Card.Header>
                    <Card.Title>Chat</Card.Title>
                  </Card.Header>
                  <Card.Content className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs px-3 py-2 rounded-lg ${
                                message.senderId === currentUser.uid
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <p className={`text-xs mt-1 ${
                                message.senderId === currentUser.uid
                                  ? 'text-primary-100'
                                  : 'text-gray-500'
                              }`}>
                                {message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Just now'}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        disabled={sendingMessage}
                      />
                      <Button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        loading={sendingMessage}
                        size="sm"
                      >
                        Send
                      </Button>
                    </form>
                  </Card.Content>
                </Card>
              )}

              {/* File Sharing Section - Only when enabled */}
              {showFileUpload && (
                <Card className="h-full flex flex-col">
                  <Card.Header>
                    <Card.Title>File Sharing</Card.Title>
                  </Card.Header>
                  <Card.Content className="flex-1 flex flex-col">
                    <div className="flex-1">
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors mb-4"
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Files</h3>
                        <p className="text-gray-600 mb-4">
                          Drag and drop files here or click to browse
                        </p>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.zip,.rar"
                          className="hidden"
                          id="file-upload"
                          onChange={handleFileInputChange}
                        />
                        <Button 
                          variant="outline"
                          onClick={handleChooseFilesClick}
                          loading={uploadingFile}
                          disabled={uploadingFile}
                          className="cursor-pointer"
                        >
                          {uploadingFile ? 'Uploading...' : 'Choose Files'}
                        </Button>
                      </div>
                      
                      {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-red-800">{error}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {uploadedFiles.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Shared Files</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">{file.size}</p>
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(file.downloadURL, '_blank')}
                                >
                                  Download
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card.Content>
                </Card>
              )}
            </div>
          )}

          {/* Show message if no features are selected */}
          {!showVideo && !showChat && !showFileUpload && (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Features Selected</h3>
              <p className="text-gray-600 mb-4">
                Please select at least one learning feature above to start your session.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Learning;




// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
// import { getUserProfile, getUserMatches, sendMessage, getMessages, endLearningSession, uploadFile } from '../firebase/services';
// import Card from '../components/ui/Card';
// import Button from '../components/ui/Button';
// import LoadingSpinner from '../components/ui/LoadingSpinner';

// const Learning = () => {
//   const { matchId } = useParams();
//   const [searchParams] = useSearchParams();
//   const sessionMode = searchParams.get('mode') || 'chat';
//   const { currentUser } = useAuth();
//   const [match, setMatch] = useState(null);
//   const [otherUser, setOtherUser] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [videoEnabled, setVideoEnabled] = useState(true);
//   const [audioEnabled, setAudioEnabled] = useState(true);
//   const [sendingMessage, setSendingMessage] = useState(false);
//   const [endingSession, setEndingSession] = useState(false);
//   const [uploadingFile, setUploadingFile] = useState(false);
//   const [uploadedFiles, setUploadedFiles] = useState([]);
  
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const messagesEndRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const navigate = useNavigate();

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   const loadMatchDetails = useCallback(async () => {
//     try {
//       setLoading(true);
      
//       // Get user's matches to find the specific match
//       const matchesResult = await getUserMatches(currentUser.uid);
      
//       if (matchesResult.success) {
//         const foundMatch = matchesResult.data.find(m => m.id === matchId);
        
//         if (foundMatch && (foundMatch.status === 'accepted' || foundMatch.status === 'connected' || foundMatch.status === 'in_session')) {
//           setMatch(foundMatch);
          
//           // Get the other user's profile
//           const otherUserId = foundMatch.users.find(uid => uid !== currentUser.uid);
//           if (otherUserId) {
//             const userResult = await getUserProfile(otherUserId);
//             if (userResult.success) {
//               setOtherUser(userResult.data);
//             } else {
//               setError('Failed to load user profile');
//             }
//           }
//         } else {
//           setError('Match not found or not accepted');
//         }
//       } else {
//         setError(matchesResult.error);
//       }
//     } catch (error) {
//       setError('Failed to load match details');
//       console.error('Error loading match details:', error);
//     } finally {
//       setLoading(false);
//     }
//   }, [currentUser.uid, matchId]);

//   useEffect(() => {
//     if (matchId && currentUser) {
//       loadMatchDetails();
//       // Only setup video call for webcam mode
//       if (sessionMode === 'webcam') {
//         setupVideoCall();
//       }
//     }

//     return () => {
//       // Cleanup video stream
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach(track => track.stop());
//       }
//     };
//   }, [matchId, currentUser, loadMatchDetails, setupVideoCall, sessionMode]);

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const setupVideoCall = async () => {
//     try {
//       // Get user media
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true
//       });
      
//       localStreamRef.current = stream;
//       if (localVideoRef.current) {
//         localVideoRef.current.srcObject = stream;
//       }

//       // Initialize Simple Peer (you'll need to install simple-peer)
//       // For now, we'll create a placeholder for the WebRTC implementation
//       console.log('Video call setup initiated');
      
//     } catch (error) {
//       console.error('Error setting up video call:', error);
//       setError('Failed to access camera/microphone. Please check permissions.');
//     }
//   };

//   const toggleVideo = () => {
//     if (localStreamRef.current) {
//       const videoTrack = localStreamRef.current.getVideoTracks()[0];
//       if (videoTrack) {
//         videoTrack.enabled = !videoTrack.enabled;
//         setVideoEnabled(videoTrack.enabled);
//       }
//     }
//   };

//   const toggleAudio = () => {
//     if (localStreamRef.current) {
//       const audioTrack = localStreamRef.current.getAudioTracks()[0];
//       if (audioTrack) {
//         audioTrack.enabled = !audioTrack.enabled;
//         setAudioEnabled(audioTrack.enabled);
//       }
//     }
//   };

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!newMessage.trim() || sendingMessage) return;

//     try {
//       setSendingMessage(true);
//       const result = await sendMessage(matchId, currentUser.uid, newMessage.trim());
      
//       if (result.success) {
//         setNewMessage('');
//       } else {
//         setError(result.error);
//       }
//     } catch (error) {
//       setError('Failed to send message');
//       console.error('Error sending message:', error);
//     } finally {
//       setSendingMessage(false);
//     }
//   };

//   const handleEndSession = async () => {
//     try {
//       setEndingSession(true);
//       const result = await endLearningSession(matchId);
      
//       if (result.success) {
//         navigate('/dashboard');
//       } else {
//         setError(result.error);
//       }
//     } catch (error) {
//       setError('Failed to end session');
//       console.error('Error ending session:', error);
//     } finally {
//       setEndingSession(false);
//     }
//   };

//   const handleFileUpload = async (event) => {
//     const files = Array.from(event.target.files);
//     if (files.length === 0) return;

//     try {
//       setUploadingFile(true);
      
//       for (const file of files) {
//         // Create a file object with metadata
//         const fileData = {
//           name: file.name,
//           size: formatFileSize(file.size),
//           type: file.type,
//           uploadedAt: new Date(),
//           uploadedBy: currentUser.uid
//         };
        
//         // Add to uploaded files list
//         setUploadedFiles(prev => [...prev, fileData]);
        
//         // Here you would typically upload to Firebase Storage
//         // For now, we'll just add it to the local state
//         console.log('File uploaded:', fileData);
//       }
//     } catch (error) {
//       setError('Failed to upload file');
//       console.error('Error uploading file:', error);
//     } finally {
//       setUploadingFile(false);
//     }
//   };

//   const formatFileSize = (bytes) => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   };

//   // Set up real-time message listener
//   useEffect(() => {
//     if (matchId) {
//       const unsubscribe = getMessages(matchId, (snapshot) => {
//         const messageList = [];
//         snapshot.forEach((doc) => {
//           messageList.push({
//             id: doc.id,
//             ...doc.data()
//           });
//         });
//         setMessages(messageList);
//       });

//       return unsubscribe;
//     }
//   }, [matchId]);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <LoadingSpinner size="lg" />
//       </div>
//     );
//   }

//   if (error || !match || !otherUser) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold text-gray-900">Learning session not available</h2>
//           <p className="mt-2 text-gray-600">{error || 'The learning session you\'re looking for doesn\'t exist.'}</p>
//           <Button className="mt-4" onClick={() => navigate('/dashboard')}>
//             Back to Dashboard
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
//         <div className="px-4 py-6 sm:px-0">
//           <div className="mb-6">
//             <Button
//               variant="outline"
//               onClick={() => navigate('/dashboard')}
//               className="mb-4"
//             >
//               ← Back to Dashboard
//             </Button>
//             <h1 className="text-3xl font-bold text-gray-900">
//               Learning Session with {otherUser.name}
//             </h1>
//             <p className="mt-2 text-gray-600">
//               Mode: <span className="font-medium capitalize">{sessionMode} Session</span>
//             </p>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Video Section - Only for webcam mode */}
//             {sessionMode === 'webcam' && (
//               <div className="lg:col-span-2">
//               <Card>
//                 <Card.Header>
//                   <Card.Title>Video Call</Card.Title>
//                 </Card.Header>
//                 <Card.Content>
//                   <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
//                     {/* Remote Video */}
//                     <div className="aspect-video bg-gray-800 flex items-center justify-center">
//                       <div className="text-center text-white">
//                         <div className="h-16 w-16 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-4">
//                           <span className="text-2xl font-bold">
//                             {otherUser.name?.charAt(0).toUpperCase()}
//                           </span>
//                         </div>
//                         <p className="text-lg font-medium">{otherUser.name}</p>
//                         <p className="text-sm text-gray-400">Waiting for connection...</p>
//                       </div>
//                       <video
//                         ref={remoteVideoRef}
//                         autoPlay
//                         playsInline
//                         className="hidden w-full h-full object-cover"
//                       />
//                     </div>
                    
//                     {/* Local Video */}
//                     <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
//                       <video
//                         ref={localVideoRef}
//                         autoPlay
//                         playsInline
//                         muted
//                         className="w-full h-full object-cover"
//                       />
//                     </div>
//                   </div>

//                   {/* Video Controls */}
//                   <div className="flex justify-center space-x-4">
//                     <Button
//                       variant={audioEnabled ? 'primary' : 'secondary'}
//                       onClick={toggleAudio}
//                       size="sm"
//                     >
//                       {audioEnabled ? '🔊' : '🔇'} Audio
//                     </Button>
//                     <Button
//                       variant={videoEnabled ? 'primary' : 'secondary'}
//                       onClick={toggleVideo}
//                       size="sm"
//                     >
//                       {videoEnabled ? '📹' : '📷'} Video
//                     </Button>
//                     <Button
//                       variant="danger"
//                       size="sm"
//                       onClick={handleEndSession}
//                       loading={endingSession}
//                       disabled={endingSession}
//                     >
//                       📞 End Session
//                     </Button>
//                   </div>
//                 </Card.Content>
//               </Card>
//               </div>
//             )}

//             {/* Chat Section */}
//             <div className={sessionMode === 'webcam' ? 'lg:col-span-1' : 'lg:col-span-2'}>
//               <Card className="h-full flex flex-col">
//                 <Card.Header>
//                   <Card.Title>Chat</Card.Title>
//                 </Card.Header>
//                 <Card.Content className="flex-1 flex flex-col">
//                   {/* Messages */}
//                   <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
//                     {messages.length === 0 ? (
//                       <div className="text-center text-gray-500 py-8">
//                         <p>No messages yet. Start the conversation!</p>
//                       </div>
//                     ) : (
//                       messages.map((message) => (
//                         <div
//                           key={message.id}
//                           className={`flex ${
//                             message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
//                           }`}
//                         >
//                           <div
//                             className={`max-w-xs px-3 py-2 rounded-lg ${
//                               message.senderId === currentUser.uid
//                                 ? 'bg-primary-600 text-white'
//                                 : 'bg-gray-200 text-gray-900'
//                             }`}
//                           >
//                             <p className="text-sm">{message.message}</p>
//                             <p className={`text-xs mt-1 ${
//                               message.senderId === currentUser.uid
//                                 ? 'text-primary-100'
//                                 : 'text-gray-500'
//                             }`}>
//                               {message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Just now'}
//                             </p>
//                           </div>
//                         </div>
//                       ))
//                     )}
//                     <div ref={messagesEndRef} />
//                   </div>

//                   {/* Message Input */}
//                   <form onSubmit={handleSendMessage} className="flex space-x-2">
//                     <input
//                       type="text"
//                       value={newMessage}
//                       onChange={(e) => setNewMessage(e.target.value)}
//                       placeholder="Type a message..."
//                       className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
//                       disabled={sendingMessage}
//                     />
//                     <Button
//                       type="submit"
//                       disabled={!newMessage.trim() || sendingMessage}
//                       loading={sendingMessage}
//                       size="sm"
//                     >
//                       Send
//                     </Button>
//                   </form>
//                 </Card.Content>
//               </Card>
//             </div>
//           </div>

//           {/* File Sharing Section */}
//           <div className={sessionMode === 'document' ? 'mt-6 lg:col-span-2' : 'mt-6'}>
//             <Card>
//               <Card.Header>
//                 <Card.Title>
//                   {sessionMode === 'document' ? 'Document Collaboration' : 'File Sharing'}
//                 </Card.Title>
//               </Card.Header>
//               <Card.Content>
//                 {sessionMode === 'document' ? (
//                   <div className="space-y-4">
//                     {/* Document Upload Area */}
//                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
//                       <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
//                         <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//                         </svg>
//                       </div>
//                       <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Documents</h3>
//                       <p className="text-gray-600 mb-4">
//                         Drag and drop files here or click to browse
//                       </p>
//                       <input
//                         type="file"
//                         multiple
//                         accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png"
//                         className="hidden"
//                         id="file-upload"
//                         onChange={handleFileUpload}
//                       />
//                       <label htmlFor="file-upload">
//                         <Button variant="outline" as="span">
//                           Choose Files
//                         </Button>
//                       </label>
//                     </div>

//                     {/* Uploaded Files List */}
//                     {uploadedFiles.length > 0 && (
//                       <div>
//                         <h4 className="text-sm font-medium text-gray-700 mb-2">Shared Documents</h4>
//                         <div className="space-y-2">
//                           {uploadedFiles.map((file, index) => (
//                             <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                               <div className="flex items-center space-x-3">
//                                 <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
//                                   <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                                   </svg>
//                                 </div>
//                                 <div>
//                                   <p className="text-sm font-medium text-gray-900">{file.name}</p>
//                                   <p className="text-xs text-gray-500">{file.size}</p>
//                                 </div>
//                               </div>
//                               <Button variant="outline" size="sm">
//                                 Download
//                               </Button>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="text-center py-8">
//                     <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
//                       <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
//                       </svg>
//                     </div>
//                     <h3 className="text-lg font-medium text-gray-900 mb-2">File Sharing</h3>
//                     <p className="text-gray-600 mb-4">
//                       Upload and share files with your learning partner
//                     </p>
//                     <input
//                       type="file"
//                       multiple
//                       className="hidden"
//                       id="file-upload-chat"
//                       onChange={handleFileUpload}
//                     />
//                     <label htmlFor="file-upload-chat">
//                       <Button variant="outline" as="span">
//                         Upload File
//                       </Button>
//                     </label>
//                   </div>
//                 )}
//               </Card.Content>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Learning;
