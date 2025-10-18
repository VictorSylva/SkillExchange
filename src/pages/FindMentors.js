import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers, createMatchRequest } from '../firebase/services';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkillTag from '../components/ui/SkillTag';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Footer from '../components/Footer';

const FindMentors = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // rating, experience, availability
  const [requestingMentor, setRequestingMentor] = useState(null);

  // Get unique skills from all mentors
  const getAvailableSkills = () => {
    const skillSet = new Set(['All']);
    mentors.forEach(mentor => {
      if (mentor.skillsToTeach && Array.isArray(mentor.skillsToTeach)) {
        mentor.skillsToTeach.forEach(skill => skillSet.add(skill));
      }
    });
    return Array.from(skillSet);
  };

  const loadMentors = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await getAllUsers();
      if (result.success) {
        // Filter out current user and only show users who have skills to teach
        const mentorsData = result.data.filter(user => 
          user.uid !== currentUser?.uid && 
          user.skillsToTeach && 
          user.skillsToTeach.length > 0
        );
        setMentors(mentorsData);
      } else {
        setError('Failed to load mentors');
        setMentors([]);
      }
    } catch (error) {
      console.error('Error loading mentors:', error);
      setError('Failed to load mentors');
      setMentors([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  // Filter and sort mentors
  useEffect(() => {
    let filtered = mentors;

    // Filter by skill
    if (selectedSkill !== 'All') {
      filtered = filtered.filter(mentor => 
        mentor.skillsToTeach && 
        mentor.skillsToTeach.some(skill => 
          skill.toLowerCase().includes(selectedSkill.toLowerCase())
        )
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(mentor => 
        mentor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mentor.skillsToTeach?.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort mentors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'experience':
          return (b.experience || 0) - (a.experience || 0);
        case 'availability':
          return (a.isAvailable ? 0 : 1) - (b.isAvailable ? 0 : 1);
        default:
          return 0;
      }
    });

    setFilteredMentors(filtered);
  }, [mentors, selectedSkill, searchTerm, sortBy]);

  const handleRequestMentor = async (mentorId) => {
    if (!currentUser?.uid) {
      navigate('/login');
      return;
    }

    try {
      setRequestingMentor(mentorId);
      const result = await createMatchRequest(currentUser.uid, mentorId);
      
      if (result.success) {
        alert('Mentor request sent successfully!');
      } else {
        alert(result.error || 'Failed to send mentor request');
      }
    } catch (error) {
      console.error('Error requesting mentor:', error);
      alert('Failed to send mentor request');
    } finally {
      setRequestingMentor(null);
    }
  };

  const getAvailabilityStatus = (mentor) => {
    if (mentor.isAvailable) {
      return { text: 'Available', color: 'text-green-600', bg: 'bg-green-100' };
    } else {
      return { text: 'Busy', color: 'text-red-600', bg: 'bg-red-100' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Mentors
          </h1>
          <p className="text-lg text-gray-600">
            Connect with experienced mentors who can guide your learning journey
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Mentors
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, bio, or skills..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Skill Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Skill
              </label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {getAvailableSkills().map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="rating">Rating</option>
                <option value="experience">Experience</option>
                <option value="availability">Availability</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="mx-auto h-20 w-20 text-red-300 mb-6">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Error loading mentors</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadMentors}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Mentors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.map((mentor, index) => {
                const availability = getAvailabilityStatus(mentor);
                return (
                  <Card key={mentor.uid} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <Card.Content>
                      <div className="flex items-start space-x-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              {mentor.name?.charAt(0).toUpperCase() || 'M'}
                            </span>
                          </div>
                        </div>

                        {/* Mentor Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {mentor.name || 'Anonymous Mentor'}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${availability.bg} ${availability.color}`}>
                              {availability.text}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {mentor.bio || 'Experienced mentor ready to help you learn and grow.'}
                          </p>

                          {/* Skills */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {mentor.skillsToTeach?.slice(0, 3).map((skill, skillIndex) => (
                                <SkillTag key={skillIndex} skill={skill} size="sm" />
                              ))}
                              {mentor.skillsToTeach?.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{mentor.skillsToTeach.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {mentor.rating || '4.5'}
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {mentor.experience || '5+'} years
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button
                            onClick={() => handleRequestMentor(mentor.uid)}
                            loading={requestingMentor === mentor.uid}
                            disabled={requestingMentor === mentor.uid || !mentor.isAvailable}
                            className="w-full"
                            size="sm"
                          >
                            {mentor.isAvailable ? 'Request Mentorship' : 'Currently Busy'}
                          </Button>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredMentors.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="mx-auto h-20 w-20 text-gray-300 mb-6">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {searchTerm || selectedSkill !== 'All' ? 'No mentors found' : 'No mentors available yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedSkill !== 'All' 
                    ? 'Try adjusting your search criteria or filters.'
                    : 'Be the first to become a mentor and help others learn!'
                  }
                </p>
                {!searchTerm && selectedSkill === 'All' && (
                  <button 
                    onClick={() => navigate('/profile?tab=teaching')}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200"
                  >
                    Become a Mentor
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default FindMentors;
