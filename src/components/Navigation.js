import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import NotificationDropdown from './ui/NotificationDropdown';

const Navigation = () => {
  const { currentUser, logout, userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/');
    }
  };

  const isActive = (path) => location.pathname === path;

  if (!currentUser) {
  return (
      <nav className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 border-b border-gray-700 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link 
                to="/" 
                className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent hover:from-primary-300 hover:to-primary-400 transition-all duration-300"
              >
                YESSkillExchange
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className="text-gray-300 hover:text-primary-400 font-medium transition-colors duration-200 relative group"
              >
                Browse
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-200 group-hover:w-full"></span>
              </Link>
              <Link
                to="/login"
                className="text-gray-300 hover:text-primary-400 font-medium transition-colors duration-200 relative group"
              >
                Learn
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-200 group-hover:w-full"></span>
              </Link>
              <Link
                to="/login"
                className="text-gray-300 hover:text-primary-400 font-medium transition-colors duration-200 relative group"
              >
                Teach
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-200 group-hover:w-full"></span>
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-300 hover:text-primary-400 font-medium transition-colors duration-200"
              >
                Sign In
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/register')}
                className="shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 border-b border-gray-700 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/dashboard" 
              className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-500 bg-clip-text text-transparent hover:from-primary-300 hover:to-primary-400 transition-all duration-300"
            >
              YESSkillExchange
            </Link>
          </div>

          {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-8">
                <Link
                  to="/browse"
                  className={`font-medium transition-all duration-200 relative group ${
                    isActive('/browse') 
                      ? 'text-primary-400' 
                      : 'text-gray-300 hover:text-primary-400'
                  }`}
                >
                  Browse
                  {isActive('/browse') && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary-400"></span>
                  )}
                  {!isActive('/browse') && (
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-200 group-hover:w-full"></span>
                  )}
                </Link>
                <Link
                  to="/dashboard"
                  className={`font-medium transition-all duration-200 relative group ${
                    isActive('/dashboard') 
                      ? 'text-primary-400' 
                      : 'text-gray-300 hover:text-primary-400'
                  }`}
                >
                  Learn
                  {isActive('/dashboard') && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary-400"></span>
                  )}
                  {!isActive('/dashboard') && (
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-200 group-hover:w-full"></span>
                  )}
                </Link>
                <Link
                  to="/profile?tab=teaching"
                  className={`font-medium transition-all duration-200 relative group ${
                    isActive('/profile') 
                      ? 'text-primary-400' 
                      : 'text-gray-300 hover:text-primary-400'
                  }`}
                >
                  Teach
                  {isActive('/profile') && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary-400"></span>
                  )}
                  {!isActive('/profile') && (
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-200 group-hover:w-full"></span>
                  )}
                </Link>
                <Link
                  to="/connections"
                  className={`font-medium transition-all duration-200 relative group ${
                    isActive('/connections') 
                      ? 'text-primary-400' 
                      : 'text-gray-300 hover:text-primary-400'
                  }`}
                >
                  Connections
                  {isActive('/connections') && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary-400"></span>
                  )}
                  {!isActive('/connections') && (
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 transition-all duration-200 group-hover:w-full"></span>
                  )}
                </Link>
              </div>

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            <NotificationDropdown />
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 text-gray-300 hover:text-primary-400 transition-all duration-200 p-1 rounded-lg hover:bg-gray-800"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-sm border border-primary-500">
                  <span className="text-white font-semibold text-sm">
                    {userProfile?.name?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden sm:block font-medium">
                  {userProfile?.name || 'User'}
                </span>
                <svg className="h-4 w-4 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 z-50 backdrop-blur-sm">
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-primary-400 transition-colors duration-200"
                  >
                    Your Profile
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-primary-400 transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                  <div className="border-t border-gray-700 my-2"></div>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-primary-400 transition-colors duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4 animate-slide-up">
            <div className="flex flex-col space-y-2">
              <Link
                to="/browse"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 text-gray-300 hover:text-primary-400 hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                Browse
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 text-gray-300 hover:text-primary-400 hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                Learn
              </Link>
              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 text-gray-300 hover:text-primary-400 hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                Teach
              </Link>
              <Link
                to="/connections"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-2 text-gray-300 hover:text-primary-400 hover:bg-gray-800 rounded-lg transition-colors duration-200"
              >
                Connections
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
