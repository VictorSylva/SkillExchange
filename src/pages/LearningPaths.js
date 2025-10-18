import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAllPublicCourses } from '../firebase/services';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkillTag from '../components/ui/SkillTag';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Footer from '../components/Footer';

const LearningPaths = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [learningPaths, setLearningPaths] = useState([]);
  const [filteredPaths, setFilteredPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Predefined learning paths with structured content
  const predefinedPaths = [
    {
      id: 'web-development',
      title: 'Complete Web Development',
      description: 'Master modern web development from HTML/CSS to advanced JavaScript frameworks',
      category: 'Programming',
      level: 'Beginner',
      duration: '6-8 months',
      skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Database'],
      courses: [
        { title: 'HTML & CSS Fundamentals', duration: '2 weeks', completed: false },
        { title: 'JavaScript Basics', duration: '3 weeks', completed: false },
        { title: 'React Development', duration: '4 weeks', completed: false },
        { title: 'Backend with Node.js', duration: '3 weeks', completed: false },
        { title: 'Database Design', duration: '2 weeks', completed: false },
        { title: 'Full-Stack Project', duration: '4 weeks', completed: false }
      ],
      instructor: 'Tech Academy',
      rating: 4.8,
      students: 12500,
      thumbnail: '/api/placeholder/400/300',
      isPopular: true
    },
    {
      id: 'data-science',
      title: 'Data Science Mastery',
      description: 'Learn data analysis, machine learning, and statistical modeling',
      category: 'Data Science',
      level: 'Intermediate',
      duration: '4-6 months',
      skills: ['Python', 'Statistics', 'Machine Learning', 'Data Visualization', 'SQL'],
      courses: [
        { title: 'Python for Data Science', duration: '3 weeks', completed: false },
        { title: 'Statistical Analysis', duration: '3 weeks', completed: false },
        { title: 'Machine Learning Basics', duration: '4 weeks', completed: false },
        { title: 'Data Visualization', duration: '2 weeks', completed: false },
        { title: 'Advanced ML Techniques', duration: '4 weeks', completed: false }
      ],
      instructor: 'Data Institute',
      rating: 4.9,
      students: 8900,
      thumbnail: '/api/placeholder/400/300',
      isPopular: true
    },
    {
      id: 'digital-marketing',
      title: 'Digital Marketing Strategy',
      description: 'Comprehensive guide to digital marketing, SEO, and social media',
      category: 'Marketing',
      level: 'Beginner',
      duration: '3-4 months',
      skills: ['SEO', 'Social Media', 'Content Marketing', 'Analytics', 'PPC'],
      courses: [
        { title: 'Marketing Fundamentals', duration: '2 weeks', completed: false },
        { title: 'SEO Optimization', duration: '3 weeks', completed: false },
        { title: 'Social Media Strategy', duration: '2 weeks', completed: false },
        { title: 'Content Creation', duration: '3 weeks', completed: false },
        { title: 'Analytics & Reporting', duration: '2 weeks', completed: false }
      ],
      instructor: 'Marketing Pro',
      rating: 4.6,
      students: 6700,
      thumbnail: '/api/placeholder/400/300',
      isPopular: false
    },
    {
      id: 'ui-ux-design',
      title: 'UI/UX Design Complete',
      description: 'Master user interface and user experience design principles',
      category: 'Design',
      level: 'Beginner',
      duration: '4-5 months',
      skills: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
      courses: [
        { title: 'Design Principles', duration: '2 weeks', completed: false },
        { title: 'User Research Methods', duration: '3 weeks', completed: false },
        { title: 'Wireframing & Prototyping', duration: '3 weeks', completed: false },
        { title: 'Visual Design', duration: '4 weeks', completed: false },
        { title: 'Design Systems', duration: '2 weeks', completed: false }
      ],
      instructor: 'Design Studio',
      rating: 4.7,
      students: 5400,
      thumbnail: '/api/placeholder/400/300',
      isPopular: false
    },
    {
      id: 'mobile-development',
      title: 'Mobile App Development',
      description: 'Build iOS and Android apps with React Native and Flutter',
      category: 'Programming',
      level: 'Intermediate',
      duration: '5-6 months',
      skills: ['React Native', 'Flutter', 'Mobile Design', 'APIs', 'App Store'],
      courses: [
        { title: 'Mobile Development Basics', duration: '2 weeks', completed: false },
        { title: 'React Native Fundamentals', duration: '4 weeks', completed: false },
        { title: 'Flutter Development', duration: '4 weeks', completed: false },
        { title: 'Mobile APIs & Backend', duration: '3 weeks', completed: false },
        { title: 'App Store Deployment', duration: '2 weeks', completed: false }
      ],
      instructor: 'Mobile Academy',
      rating: 4.5,
      students: 4200,
      thumbnail: '/api/placeholder/400/300',
      isPopular: false
    },
    {
      id: 'cybersecurity',
      title: 'Cybersecurity Fundamentals',
      description: 'Learn essential cybersecurity concepts and practices',
      category: 'Security',
      level: 'Beginner',
      duration: '3-4 months',
      skills: ['Network Security', 'Ethical Hacking', 'Risk Assessment', 'Compliance', 'Incident Response'],
      courses: [
        { title: 'Security Fundamentals', duration: '2 weeks', completed: false },
        { title: 'Network Security', duration: '3 weeks', completed: false },
        { title: 'Ethical Hacking', duration: '4 weeks', completed: false },
        { title: 'Risk Management', duration: '2 weeks', completed: false },
        { title: 'Incident Response', duration: '3 weeks', completed: false }
      ],
      instructor: 'Security Expert',
      rating: 4.8,
      students: 3800,
      thumbnail: '/api/placeholder/400/300',
      isPopular: true
    }
  ];

  const getCategories = () => {
    const categorySet = new Set(['All']);
    predefinedPaths.forEach(path => {
      categorySet.add(path.category);
    });
    return Array.from(categorySet);
  };

  const getLevels = () => {
    return ['All', 'Beginner', 'Intermediate', 'Advanced'];
  };

  const loadLearningPaths = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // For now, use predefined paths
      // In a real app, you'd fetch from your database
      setLearningPaths(predefinedPaths);
    } catch (error) {
      console.error('Error loading learning paths:', error);
      setError('Failed to load learning paths');
      setLearningPaths([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLearningPaths();
  }, [loadLearningPaths]);

  // Filter learning paths
  useEffect(() => {
    let filtered = learningPaths;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(path => path.category === selectedCategory);
    }

    // Filter by level
    if (selectedLevel !== 'All') {
      filtered = filtered.filter(path => path.level === selectedLevel);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(path => 
        path.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        path.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        path.skills.some(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredPaths(filtered);
  }, [learningPaths, selectedCategory, selectedLevel, searchTerm]);

  const handleStartPath = (pathId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // In a real app, you'd save the user's progress
    console.log('Starting learning path:', pathId);
    alert(`Starting ${predefinedPaths.find(p => p.id === pathId)?.title}! This feature will be implemented soon.`);
  };

  const getProgressPercentage = (path) => {
    // In a real app, you'd calculate based on user's actual progress
    return Math.floor(Math.random() * 30); // Random for demo
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Learning Paths
          </h1>
          <p className="text-lg text-gray-600">
            Structured learning journeys designed to take you from beginner to expert
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Paths
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, skills, or description..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {getCategories().map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {getLevels().map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Quick Stats */}
            <div className="flex items-end">
              <div className="bg-white p-4 rounded-lg border border-gray-200 w-full">
                <div className="text-sm text-gray-600">Available Paths</div>
                <div className="text-2xl font-bold text-primary-600">{filteredPaths.length}</div>
              </div>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Error loading learning paths</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadLearningPaths}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Learning Paths Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredPaths.map((path, index) => {
                const progress = getProgressPercentage(path);
                return (
                  <Card key={path.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                    <Card.Content>
                      <div className="flex items-start space-x-4">
                        {/* Thumbnail */}
                        <div className="flex-shrink-0">
                          <div className="h-24 w-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold text-center">
                              {path.category}
                            </span>
                          </div>
                        </div>

                        {/* Path Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                {path.title}
                              </h3>
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {path.level}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {path.duration}
                                </span>
                                {path.isPopular && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Popular
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {path.description}
                          </p>

                          {/* Skills */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-1">
                              {path.skills.slice(0, 4).map((skill, skillIndex) => (
                                <SkillTag key={skillIndex} skill={skill} size="sm" />
                              ))}
                              {path.skills.length > 4 && (
                                <span className="text-xs text-gray-500">
                                  +{path.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {path.rating}
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              {path.students.toLocaleString()} students
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {path.duration}
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button
                            onClick={() => handleStartPath(path.id)}
                            className="w-full"
                            size="sm"
                          >
                            {progress > 0 ? 'Continue Learning' : 'Start Learning Path'}
                          </Button>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredPaths.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="mx-auto h-20 w-20 text-gray-300 mb-6">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {searchTerm || selectedCategory !== 'All' || selectedLevel !== 'All' ? 'No learning paths found' : 'No learning paths available yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCategory !== 'All' || selectedLevel !== 'All'
                    ? 'Try adjusting your search criteria or filters.'
                    : 'Learning paths will be available soon!'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default LearningPaths;
