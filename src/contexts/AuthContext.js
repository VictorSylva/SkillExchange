import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { createUserProfile, getUserProfile } from '../firebase/services';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function
  const signup = async (email, password, userData) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(user, {
        displayName: userData.name
      });
      
      // Create user profile in Firestore
      const profileData = {
        name: userData.name,
        email: userData.email,
        skillsHave: userData.skillsHave || [],
        skillsToLearn: userData.skillsToLearn || [],
        avatar: null,
        bio: '',
        location: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      
      const result = await createUserProfile(user.uid, profileData);
      
      if (result.success) {
        setUserProfile(profileData);
        return { success: true, user };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign in function
  const signin = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user };
    } catch (error) {
      console.error('Signin error:', error);
      return { success: false, error: error.message };
    }
  };

  // Google sign in function
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if user profile exists, if not create one
      const profileResult = await getUserProfile(user.uid);
      if (!profileResult.success || profileResult.error === 'User not found') {
        const profileData = {
          name: user.displayName || 'New User',
          email: user.email,
          skillsHave: [],
          skillsToLearn: [],
          avatar: user.photoURL,
          bio: '',
          location: '',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        await createUserProfile(user.uid, profileData);
        setUserProfile(profileData);
      }
      
      return { success: true, user };
    } catch (error) {
      console.error('Google signin error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign out function
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Load user profile from Firestore
  const loadUserProfile = async (userId) => {
    try {
      const result = await getUserProfile(userId);
      if (result.success) {
        setUserProfile(result.data);
      } else {
        console.error('Failed to load user profile:', result.error);
        // If user profile doesn't exist, create a basic one
        if (result.error === 'User not found') {
          const basicProfile = {
            name: 'New User',
            email: '',
            skillsHave: [],
            skillsToLearn: [],
            bio: '',
            location: ''
          };
          const createResult = await createUserProfile(userId, basicProfile);
          if (createResult.success) {
            setUserProfile(basicProfile);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Update user profile
  const updateUserProfile = async (userId, profileData) => {
    try {
      const { updateUserProfile: updateProfileService } = await import('../firebase/services');
      const result = await updateProfileService(userId, profileData);
      
      if (result.success) {
        setUserProfile(prev => ({ ...prev, ...profileData }));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    signin,
    signInWithGoogle,
    logout,
    updateUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
