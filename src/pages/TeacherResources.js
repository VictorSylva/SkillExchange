import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Footer from '../components/Footer';

const TeacherResources = () => {
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
            Teacher Resources
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive guides, tools, and resources to help you become an effective online teacher and create engaging learning experiences.
          </p>
        </div>

        {/* Resource Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Course Creation</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Course structure best practices</li>
              <li>• Content organization strategies</li>
              <li>• Learning objective development</li>
              <li>• Assessment design principles</li>
              <li>• Student engagement techniques</li>
            </ul>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Video Production</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Recording setup and equipment</li>
              <li>• Lighting and audio optimization</li>
              <li>• Screen recording techniques</li>
              <li>• Video editing best practices</li>
              <li>• Accessibility considerations</li>
            </ul>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Student Engagement</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Interactive content creation</li>
              <li>• Discussion facilitation</li>
              <li>• Gamification strategies</li>
              <li>• Feedback and assessment</li>
              <li>• Community building techniques</li>
            </ul>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Analytics & Insights</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Student progress tracking</li>
              <li>• Course performance metrics</li>
              <li>• Engagement analytics</li>
              <li>• Improvement recommendations</li>
              <li>• Success measurement tools</li>
            </ul>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Communication</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Effective feedback strategies</li>
              <li>• Student support techniques</li>
              <li>• Conflict resolution</li>
              <li>• Community moderation</li>
              <li>• Professional communication</li>
            </ul>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Technology Tools</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Platform features guide</li>
              <li>• Third-party integrations</li>
              <li>• Accessibility tools</li>
              <li>• Mobile optimization</li>
              <li>• Troubleshooting guides</li>
            </ul>
          </Card>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start Guide for New Teachers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Set Up Your Profile</h3>
                  <p className="text-gray-600">Complete your teacher profile with your expertise, experience, and teaching philosophy.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Plan Your First Course</h3>
                  <p className="text-gray-600">Define learning objectives, structure your content, and create a course outline.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Content</h3>
                  <p className="text-gray-600">Record videos, create materials, and organize your course content effectively.</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">4</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Test and Refine</h3>
                  <p className="text-gray-600">Review your content, test the learning experience, and make improvements.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">5</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Publish and Promote</h3>
                  <p className="text-gray-600">Launch your course and use our tools to reach potential students.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-sm">6</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Engage and Improve</h3>
                  <p className="text-gray-600">Interact with students, gather feedback, and continuously improve your teaching.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Community Support */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Our Teacher Community</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect with other teachers, share experiences, get support, and learn from the best practices of successful educators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/community')}
                size="lg"
              >
                Join Community
              </Button>
              <Button 
                onClick={() => navigate('/profile')}
                variant="outline"
                size="lg"
              >
                Start Teaching
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TeacherResources;
