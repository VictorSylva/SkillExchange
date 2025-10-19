import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  
  const { signin, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setIsGoogleAccount(false);

    console.log('Login form submitted with:', { 
      email: formData.email, 
      passwordLength: formData.password.length 
    });

    const result = await signin(formData.email, formData.password);
    
    console.log('Signin result:', result);
    
    if (result.success) {
      console.log('Login successful, navigating to dashboard');
      navigate('/dashboard');
    } else {
      console.log('Login failed:', result.error);
      
      // Check if this is a known Google OAuth account
      if (formData.email === 'mbasitisylva@gmail.com' || 
          result.error.includes('Google Sign-In') ||
          result.error.includes('invalid-credential')) {
        setIsGoogleAccount(true);
        setError('This account was created with Google Sign-In. You can either use Google Sign-In or set up a password for this account.');
      } else {
        setError(result.error);
      }
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithGoogle();
      if (result.success) {
        if (result.needsPasswordSetup) {
          navigate('/setup-password');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-bold text-gradient mb-2 hover:scale-105 transition-transform duration-200">
              YESSkillExchange
            </h1>
          </Link>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome back
          </h2>
          <p className="text-gray-600">
            Sign in to continue your learning journey
          </p>
        </div>
        
        <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-large">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-slide-up">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    {error}
                    {isGoogleAccount && (
                      <div className="mt-3 space-y-2">
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            onClick={handleGoogleSignIn}
                            size="sm"
                            className="text-xs"
                          >
                            Use Google Sign-In
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600">
                          After setting up a password, you'll be able to sign in with either method.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-5">
              <Input
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
              
              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
              size="lg"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full"
              variant="outline"
              loading={loading}
              disabled={loading}
              size="lg"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </Button>
            
          </form>
        </Card>

        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200"
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
