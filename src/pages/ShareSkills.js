import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Footer from '../components/Footer';

const ShareSkills = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [currentUser, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Share Your Skills
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create courses, share your expertise, and help others learn. Build your teaching portfolio and make a positive impact in the learning community.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Course</h3>
            <p className="text-gray-600 mb-6">Design and publish your own course with structured lessons and materials.</p>
            <Button 
              onClick={() => navigate('/profile?tab=teaching')}
              className="w-full"
            >
              Start Creating
            </Button>
          </Card>

          <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Become a Mentor</h3>
            <p className="text-gray-600 mb-6">Connect with learners and provide personalized guidance and support.</p>
            <Button 
              onClick={() => navigate('/find-mentors')}
              variant="outline"
              className="w-full"
            >
              Find Mentees
            </Button>
          </Card>

          <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Live Sessions</h3>
            <p className="text-gray-600 mb-6">Host interactive live learning sessions and workshops.</p>
            <Button 
              onClick={() => navigate('/create-sessions')}
              variant="outline"
              className="w-full"
            >
              Schedule Session
            </Button>
          </Card>
        </div>

        {/* Teaching Resources */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Teaching Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Getting Started</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• How to create engaging course content</li>
                <li>• Best practices for video lessons</li>
                <li>• Structuring your course curriculum</li>
                <li>• Setting learning objectives</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Advanced Tips</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Building student engagement</li>
                <li>• Creating interactive content</li>
                <li>• Managing course discussions</li>
                <li>• Tracking student progress</li>
              </ul>
            </div>
          </div>
          <div className="mt-6">
            <Button 
              onClick={() => navigate('/teacher-resources')}
              variant="outline"
            >
              View All Resources
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ShareSkills;
