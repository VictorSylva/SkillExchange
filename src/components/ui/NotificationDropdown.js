import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserNotifications } from '../../firebase/services';

const NotificationDropdown = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Load notifications
  const loadNotifications = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      const result = await getUserNotifications(currentUser.uid);
      if (result.success) {
        setNotifications(result.data || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on mount and when user changes
  useEffect(() => {
    loadNotifications();
  }, [currentUser?.uid]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewProfile = (userId) => {
    setIsOpen(false);
    navigate(`/profile/${userId}`);
  };

  const handleGoToConnections = () => {
    setIsOpen(false);
    navigate('/connections');
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 17H6l5 5v-5zM15 17V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2z" />
        </svg>
        
        {/* Notification badge */}
        {notifications && notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-large border border-gray-200 z-50 animate-slide-up">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {notifications && notifications.length > 0 && (
                <span className="text-sm text-gray-500">{notifications.length} new</span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <p className="text-sm text-gray-500 mt-2">Loading...</p>
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-5 5v-5zM11 17H6l5 5v-5zM15 17V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications && notifications.slice(0, 5).map((notification, index) => (
                  <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {notification.requesterName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.requesterName || 'Someone'} wants to connect
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                        {notification.requesterSkills && notification.requesterSkills.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {notification.requesterSkills.slice(0, 2).map((skill, skillIndex) => (
                              <span key={skillIndex} className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                            {notification.requesterSkills.length > 2 && (
                              <span className="text-xs text-gray-500">+{notification.requesterSkills.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => handleViewProfile(notification.requesterId)}
                        className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 transition-colors duration-200"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={handleGoToConnections}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition-colors duration-200"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications && notifications.length > 5 && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={handleGoToConnections}
                className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2"
              >
                View all {notifications.length} notifications
              </button>
            </div>
          )}

          {notifications && notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={handleGoToConnections}
                className="w-full bg-primary-600 text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                Manage Connections
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
