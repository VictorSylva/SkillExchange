import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import SkillTag from '../components/ui/SkillTag';
import Footer from '../components/Footer';

const Register = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: location.state?.email || '',
    password: '',
    confirmPassword: '',
    skillsHave: [],
    skillsToLearn: []
  });
  const [skillInput, setSkillInput] = useState('');
  const [skillToLearnInput, setSkillToLearnInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const addSkill = (skill, type) => {
    if (!skill.trim()) return;
    
    const skillList = skill.trim().toLowerCase();
    if (type === 'have' && !formData.skillsHave.includes(skillList)) {
      setFormData(prev => ({
        ...prev,
        skillsHave: [...prev.skillsHave, skillList]
      }));
      setSkillInput('');
    } else if (type === 'learn' && !formData.skillsToLearn.includes(skillList)) {
      setFormData(prev => ({
        ...prev,
        skillsToLearn: [...prev.skillsToLearn, skillList]
      }));
      setSkillToLearnInput('');
    }
  };

  const removeSkill = (skill, type) => {
    if (type === 'have') {
      setFormData(prev => ({
        ...prev,
        skillsHave: prev.skillsHave.filter(s => s !== skill)
      }));
    } else if (type === 'learn') {
      setFormData(prev => ({
        ...prev,
        skillsToLearn: prev.skillsToLearn.filter(s => s !== skill)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.skillsHave.length === 0 || formData.skillsToLearn.length === 0) {
      setError('Please add at least one skill you have and one skill you want to learn');
      setLoading(false);
      return;
    }

    const result = await signup(formData.email, formData.password, {
      name: formData.name,
      email: formData.email,
      skillsHave: formData.skillsHave,
      skillsToLearn: formData.skillsToLearn
    });
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        <Card>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}
            
            <Input
              label="Full name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
            
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
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
            />
            
            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
            />

            {/* Skills I Have */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills I have
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput, 'have'))}
                  placeholder="Add a skill"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addSkill(skillInput, 'have')}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skillsHave.map((skill, index) => (
                  <SkillTag
                    key={index}
                    skill={skill}
                    variant="primary"
                    removable
                    onRemove={(skill) => removeSkill(skill, 'have')}
                  />
                ))}
              </div>
            </div>

            {/* Skills I Want to Learn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills I want to learn
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={skillToLearnInput}
                  onChange={(e) => setSkillToLearnInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillToLearnInput, 'learn'))}
                  placeholder="Add a skill to learn"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addSkill(skillToLearnInput, 'learn')}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skillsToLearn.map((skill, index) => (
                  <SkillTag
                    key={index}
                    skill={skill}
                    variant="success"
                    removable
                    onRemove={(skill) => removeSkill(skill, 'learn')}
                  />
                ))}
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              Create account
            </Button>
          </form>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default Register;
