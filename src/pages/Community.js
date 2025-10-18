import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllUsers } from '../firebase/services';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkillTag from '../components/ui/SkillTag';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Footer from '../components/Footer';

const Community = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [communityMembers, setCommunityMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, rating, experience
  const [activeTab, setActiveTab] = useState('members'); // members, discussions, events

  // Mock discussion posts
  const discussions = [
    {
      id: 1,
      title: 'Best practices for learning React in 2024',
      author: 'Sarah Johnson',
      authorAvatar: 'SJ',
      timestamp: '2 hours ago',
      replies: 12,
      likes: 24,
      tags: ['React', 'JavaScript', 'Learning'],
      isPinned: true
    },
    {
      id: 2,
      title: 'Looking for a study buddy for Python data science',
      author: 'Mike Chen',
      authorAvatar: 'MC',
      timestamp: '4 hours ago',
      replies: 8,
      likes: 15,
      tags: ['Python', 'Data Science', 'Study Group'],
      isPinned: false
    },
    {
      id: 3,
      title: 'UI/UX Design trends for 2024 - What do you think?',
      author: 'Emma Wilson',
      authorAvatar: 'EW',
      timestamp: '6 hours ago',
      replies: 18,
      likes: 32,
      tags: ['Design', 'UI/UX', 'Trends'],
      isPinned: false
    },
    {
      id: 4,
      title: 'Share your success stories! What did you learn this month?',
      author: 'Alex Rodriguez',
      authorAvatar: 'AR',
      timestamp: '1 day ago',
      replies: 25,
      likes: 45,
      tags: ['Success', 'Learning', 'Community'],
      isPinned: true
    }
  ];

  // Mock events
  const events = [
    {
      id: 1,
      title: 'Weekly Coding Challenge',
      description: 'Join our weekly coding challenge and compete with other learners',
      date: '2024-01-15',
      time: '19:00',
      type: 'Online',
      attendees: 45,
      maxAttendees: 100,
      organizer: 'Tech Community',
      tags: ['Programming', 'Challenge', 'Competition']
    },
    {
      id: 2,
      title: 'Design Thinking Workshop',
      description: 'Learn the fundamentals of design thinking and problem-solving',
      date: '2024-01-20',
      time: '14:00',
      type: 'In-Person',
      location: 'Community Center, Downtown',
      attendees: 23,
      maxAttendees: 30,
      organizer: 'Design Guild',
      tags: ['Design', 'Workshop', 'Creative']
    },
    {
      id: 3,
      title: 'Data Science Meetup',
      description: 'Monthly meetup for data science enthusiasts and professionals',
      date: '2024-01-25',
      time: '18:30',
      type: 'Hybrid',
      location: 'Tech Hub + Online',
      attendees: 67,
      maxAttendees: 80,
      organizer: 'Data Science Society',
      tags: ['Data Science', 'Networking', 'Professional']
    }
  ];

  // Get unique skills from all community members
  const getAvailableSkills = () => {
    const skillSet = new Set(['All']);
    communityMembers.forEach(member => {
      if (member.skillsToTeach && Array.isArray(member.skillsToTeach)) {
        member.skillsToTeach.forEach(skill => skillSet.add(skill));
      }
      if (member.skillsToLearn && Array.isArray(member.skillsToLearn)) {
        member.skillsToLearn.forEach(skill => skillSet.add(skill));
      }
    });
    return Array.from(skillSet);
  };

  const loadCommunityMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await getAllUsers();
      if (result.success) {
        // Filter out current user
        const membersData = result.data.filter(user => user.uid !== currentUser?.uid);
        setCommunityMembers(membersData);
      } else {
        setError('Failed to load community members');
        setCommunityMembers([]);
      }
    } catch (error) {
      console.error('Error loading community members:', error);
      setError('Failed to load community members');
      setCommunityMembers([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    loadCommunityMembers();
  }, [loadCommunityMembers]);

  // Filter community members
  useEffect(() => {
    let filtered = communityMembers;

    // Filter by skill
    if (selectedSkill !== 'All') {
      filtered = filtered.filter(member => 
        (member.skillsToTeach && member.skillsToTeach.some(skill => 
          skill.toLowerCase().includes(selectedSkill.toLowerCase())
        )) ||
        (member.skillsToLearn && member.skillsToLearn.some(skill => 
          skill.toLowerCase().includes(selectedSkill.toLowerCase())
        ))
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(member => 
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.skillsToTeach && member.skillsToTeach.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
        (member.skillsToLearn && member.skillsToLearn.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    // Sort members
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'experience':
          return (b.experience || 0) - (a.experience || 0);
        case 'recent':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    setFilteredMembers(filtered);
  }, [communityMembers, selectedSkill, searchTerm, sortBy]);

  const handleConnect = (memberId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    console.log('Connecting with member:', memberId);
    alert('Connection request sent! This feature will be implemented soon.');
  };

  const handleJoinEvent = (eventId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    console.log('Joining event:', eventId);
    alert('Event joined successfully! This feature will be implemented soon.');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Community
          </h1>
          <p className="text-lg text-gray-600">
            Connect with learners, share knowledge, and grow together
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'members', label: 'Members', count: communityMembers.length },
                { id: 'discussions', label: 'Discussions', count: discussions.length },
                { id: 'events', label: 'Events', count: events.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <>
            {/* Search and Filters */}
            <div className="mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Members
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
                    <option value="recent">Most Recent</option>
                    <option value="rating">Rating</option>
                    <option value="experience">Experience</option>
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
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Error loading community members</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                  onClick={loadCommunityMembers}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {/* Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMembers.map((member, index) => (
                    <Card key={member.uid} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <Card.Content>
                        <div className="flex items-start space-x-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                              <span className="text-white text-xl font-bold">
                                {member.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                          </div>

                          {/* Member Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {member.name || 'Anonymous User'}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {member.bio || 'Community member passionate about learning and sharing knowledge.'}
                            </p>

                            {/* Skills to Teach */}
                            {member.skillsToTeach && member.skillsToTeach.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs font-medium text-gray-500 mb-1">Can Teach:</div>
                                <div className="flex flex-wrap gap-1">
                                  {member.skillsToTeach.slice(0, 3).map((skill, skillIndex) => (
                                    <SkillTag key={skillIndex} skill={skill} size="sm" />
                                  ))}
                                  {member.skillsToTeach.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{member.skillsToTeach.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Skills to Learn */}
                            {member.skillsToLearn && member.skillsToLearn.length > 0 && (
                              <div className="mb-4">
                                <div className="text-xs font-medium text-gray-500 mb-1">Learning:</div>
                                <div className="flex flex-wrap gap-1">
                                  {member.skillsToLearn.slice(0, 2).map((skill, skillIndex) => (
                                    <span key={skillIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {skill}
                                    </span>
                                  ))}
                                  {member.skillsToLearn.length > 2 && (
                                    <span className="text-xs text-gray-500">
                                      +{member.skillsToLearn.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Connect Button */}
                            <Button
                              onClick={() => handleConnect(member.uid)}
                              className="w-full"
                              size="sm"
                            >
                              Connect
                            </Button>
                          </div>
                        </div>
                      </Card.Content>
                    </Card>
                  ))}
                </div>

                {/* Empty State */}
                {filteredMembers.length === 0 && !loading && (
                  <div className="text-center py-16">
                    <div className="mx-auto h-20 w-20 text-gray-300 mb-6">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {searchTerm || selectedSkill !== 'All' ? 'No members found' : 'No community members yet'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || selectedSkill !== 'All' 
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Be the first to join our community!'
                      }
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Discussions Tab */}
        {activeTab === 'discussions' && (
          <div className="space-y-6">
            {discussions.map((discussion, index) => (
              <Card key={discussion.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <Card.Content>
                  <div className="flex items-start space-x-4">
                    {/* Author Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {discussion.authorAvatar}
                        </span>
                      </div>
                    </div>

                    {/* Discussion Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{discussion.author}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{discussion.timestamp}</span>
                          {discussion.isPinned && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pinned
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {discussion.title}
                      </h3>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {discussion.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {discussion.replies} replies
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {discussion.likes} likes
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {events.map((event, index) => (
              <Card key={event.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <Card.Content>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {event.description}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.type === 'Online' ? 'bg-green-100 text-green-800' :
                      event.type === 'In-Person' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {event.type}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(event.date)} at {event.time}
                    </div>
                    {event.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      {event.attendees}/{event.maxAttendees} attendees
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {event.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Join Button */}
                  <Button
                    onClick={() => handleJoinEvent(event.id)}
                    className="w-full"
                    size="sm"
                    disabled={event.attendees >= event.maxAttendees}
                  >
                    {event.attendees >= event.maxAttendees ? 'Event Full' : 'Join Event'}
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Community;
