import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider,
  updatePassword,
  reauthenticateWithCredential
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
      console.log('Attempting to sign in with:', { email, password: '***' });
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      console.log('Sign in successful:', user);
      return { success: true, user };
    } catch (error) {
      console.error('Signin error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide more specific error messages
      let errorMessage = error.message;
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Link email/password to existing Google account
  const linkEmailPassword = async (password) => {
    try {
      if (!currentUser) {
        return { success: false, error: 'No user is currently signed in' };
      }

      // Check if user already has email/password linked
      const providers = currentUser.providerData.map(provider => provider.providerId);
      if (providers.includes('password')) {
        return { success: false, error: 'Email/password authentication is already linked to this account' };
      }

      // Create credential for the current user's email
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      
      // Link the credential to the current user
      const result = await linkWithCredential(currentUser, credential);
      console.log('Email/password linked successfully:', result);
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Error linking email/password:', error);
      return { success: false, error: error.message };
    }
  };

  // Set password for Google OAuth users
  const setPasswordForGoogleUser = async (password) => {
    try {
      if (!currentUser) {
        return { success: false, error: 'No user is currently signed in' };
      }

      // Check if user is a Google OAuth user
      const providers = currentUser.providerData.map(provider => provider.providerId);
      if (!providers.includes('google.com')) {
        return { success: false, error: 'This function is only for Google OAuth users' };
      }

      // Check if password is already set
      if (providers.includes('password')) {
        return { success: false, error: 'Password is already set for this account' };
      }

      // Link email/password credential
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      const result = await linkWithCredential(currentUser, credential);
      
      console.log('Password set successfully for Google user:', result);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Error setting password for Google user:', error);
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
      
      // Check if this is a Google OAuth user without password
      const providers = user.providerData.map(provider => provider.providerId);
      const isGoogleOnly = providers.includes('google.com') && !providers.includes('password');
      
      return { 
        success: true, 
        user,
        needsPasswordSetup: isGoogleOnly
      };
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
        // Update local state immediately
        setUserProfile(prev => ({ ...prev, ...profileData }));
        // Also refresh from Firestore to ensure consistency
        await loadUserProfile(userId);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Refresh user profile from Firestore
  const refreshUserProfile = async () => {
    if (currentUser) {
      await loadUserProfile(currentUser.uid);
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
    refreshUserProfile,
    linkEmailPassword,
    setPasswordForGoogleUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
