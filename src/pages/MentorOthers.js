import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Footer from '../components/Footer';

const MentorOthers = () => {
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
            Mentor Others
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Share your knowledge and experience by mentoring learners. Help others grow and develop their skills through personalized guidance and support.
          </p>
        </div>

        {/* Mentor Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Make an Impact</h3>
            <p className="text-gray-600">Help learners achieve their goals and make a meaningful difference in their learning journey.</p>
          </Card>

          <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Develop Skills</h3>
            <p className="text-gray-600">Enhance your own teaching and communication skills while helping others learn.</p>
          </Card>

          <Card className="text-center p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Network</h3>
            <p className="text-gray-600">Connect with like-minded professionals and expand your professional network.</p>
          </Card>
        </div>

        {/* How to Get Started */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Get Started as a Mentor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Complete Your Profile</h3>
                  <p className="text-gray-600">Add your skills, experience, and areas of expertise to help learners find you.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Set Your Availability</h3>
                  <p className="text-gray-600">Define when you're available for mentoring sessions and set your preferred communication methods.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Connect with Mentees</h3>
                  <p className="text-gray-600">Browse learner profiles and connect with those who match your expertise and interests.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">4</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Start Mentoring</h3>
                  <p className="text-gray-600">Begin your mentoring relationship with regular check-ins and guidance sessions.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">5</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Track Progress</h3>
                  <p className="text-gray-600">Monitor your mentee's progress and celebrate their achievements together.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">6</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Grow Together</h3>
                  <p className="text-gray-600">Continue learning and growing as both a mentor and a professional in your field.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Mentoring?</h2>
          <p className="text-gray-600 mb-8">Join our community of mentors and help shape the next generation of learners.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/profile')}
              size="lg"
            >
              Complete Your Profile
            </Button>
            <Button 
              onClick={() => navigate('/find-mentors')}
              variant="outline"
              size="lg"
            >
              Find Mentees
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MentorOthers;
