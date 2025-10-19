import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const SetupPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  
  const { currentUser, setPasswordForGoogleUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      const providers = currentUser.providerData.map(provider => provider.providerId);
      setIsGoogleUser(providers.includes('google.com') && !providers.includes('password'));
      
      if (!providers.includes('google.com')) {
        // Not a Google user, redirect to login
        navigate('/login');
      } else if (providers.includes('password')) {
        // Already has password, redirect to dashboard
        navigate('/dashboard');
      }
    } else {
      // Not signed in, redirect to login
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const result = await setPasswordForGoogleUser(password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  if (!currentUser || !isGoogleUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient mb-2">
            YESSkillExchange
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Set Up Password
          </h2>
          <p className="text-gray-600">
            Add a password to your account so you can sign in with email and password in the future.
          </p>
        </div>
        
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-large">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Account: {currentUser.email}</p>
                    <p className="text-sm">Currently signed in with Google</p>
                  </div>
                </div>
              </div>

              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
              />
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                loading={loading}
                disabled={loading}
                size="lg"
              >
                {loading ? 'Setting up...' : 'Set Up Password'}
              </Button>

              <Button
                type="button"
                onClick={handleSkip}
                variant="outline"
                className="w-full"
                disabled={loading}
                size="lg"
              >
                Skip for now
              </Button>
            </div>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            After setting up your password, you'll be able to sign in using either:
          </p>
          <ul className="list-disc list-inside mt-2 text-sm text-gray-500 space-y-1">
            <li>Google Sign-In</li>
            <li>Email and Password</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SetupPassword;
