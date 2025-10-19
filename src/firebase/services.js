import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from './config';

// User Services
export const createUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId, userData) => {
  try {
    console.log('Updating user profile for:', userId);
    console.log('Data to update:', userData);
    
    const userRef = doc(db, 'users', userId);
    const updateData = {
      ...userData,
      updatedAt: serverTimestamp()
    };
    
    console.log('Calling updateDoc with data:', updateData);
    await updateDoc(userRef, updateData);
    
    console.log('Update successful!');
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    console.error('Error details:', error.message, error.code);
    return { success: false, error: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const allUsers = [];
    
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      allUsers.push({
        uid: userDoc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate?.() || new Date(userData.createdAt),
        updatedAt: userData.updatedAt?.toDate?.() || new Date(userData.updatedAt)
      });
    });
    
    // Sort by creation date (newest first)
    allUsers.sort((a, b) => {
      const dateA = a.createdAt || new Date(0);
      const dateB = b.createdAt || new Date(0);
      return dateB - dateA;
    });
    
    return { success: true, data: allUsers };
  } catch (error) {
    console.error('Error fetching all users:', error);
    return { success: false, error: error.message };
  }
};

// Course Services
export const getAllPublicCourses = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    const allCourses = [];
    
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      if (userData.teachingCourses && Array.isArray(userData.teachingCourses)) {
        userData.teachingCourses.forEach((course) => {
          if (course.isPublic) {
            allCourses.push({
              ...course,
              instructorId: userDoc.id,
              instructorName: userData.name || 'Unknown Instructor',
              instructorTitle: userData.bio || 'Instructor'
            });
          }
        });
      }
    });
    
    // Sort by creation date (newest first)
    allCourses.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB - dateA;
    });
    
    return { success: true, data: allCourses };
  } catch (error) {
    console.error('Error fetching public courses:', error);
    return { success: false, error: error.message };
  }
};

export const getCoursesByUser = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const courses = userData.teachingCourses || [];
      return { success: true, data: courses };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error fetching user courses:', error);
    return { success: false, error: error.message };
  }
};

// Get courses from connected users (both public and private)
export const getConnectedUsersCourses = async (currentUserId) => {
  try {
    // First, get all matches for the current user
    const matchesResult = await getUserMatches(currentUserId);
    if (!matchesResult.success) {
      return { success: false, error: matchesResult.error };
    }
    
    const allMatches = matchesResult.data || [];
    const connectedMatches = allMatches.filter(match => match.status === 'connected');
    
    if (connectedMatches.length === 0) {
      return { success: true, data: [] };
    }
    
    // Get all connected user IDs
    const connectedUserIds = connectedMatches.map(match => 
      match.requesterId === currentUserId ? match.targetUserId : match.requesterId
    );
    
    // Get courses from all connected users
    const allCourses = [];
    for (const userId of connectedUserIds) {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const userCourses = userData.teachingCourses || [];
        
        // Add all courses (both public and private) from connected users
        userCourses.forEach(course => {
          allCourses.push({
            ...course,
            instructorId: userId,
            instructorName: userData.name || 'Unknown Instructor',
            instructorTitle: userData.bio || 'Instructor',
            isFromConnection: true // Mark as from connection
          });
        });
      }
    }
    
    // Sort by creation date (newest first)
    allCourses.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB - dateA;
    });
    
    return { success: true, data: allCourses };
  } catch (error) {
    console.error('Error fetching connected users courses:', error);
    return { success: false, error: error.message };
  }
};

// Matching Services
export const findPotentialMatches = async (currentUserId) => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const currentUserSnap = await getDoc(currentUserRef);
    
    if (!currentUserSnap.exists()) {
      return { success: false, error: 'Current user not found' };
    }
    
    const currentUser = currentUserSnap.data();
    const skillsToLearn = currentUser.skillsToLearn || [];
    const skillsHave = currentUser.skillsHave || [];
    
    if (skillsToLearn.length === 0 || skillsHave.length === 0) {
      return { success: true, data: [] };
    }

    // First, get all existing matches to exclude already connected users
    const existingMatchesResult = await getUserMatches(currentUserId);
    const connectedUserIds = new Set();
    
    if (existingMatchesResult.success && existingMatchesResult.data) {
      existingMatchesResult.data.forEach(match => {
        // Add all users from matches with any status (pending, connected, etc.)
        match.users.forEach(userId => {
          if (userId !== currentUserId) {
            connectedUserIds.add(userId);
          }
        });
      });
    }
    
    // Find users who have skills the current user wants to learn
    // We'll do this in two separate queries due to Firestore limitations
    const usersRef = collection(db, 'users');
    
    // First query: Find users who have skills the current user wants to learn
    const q1 = query(
      usersRef,
      where('skillsHave', 'array-contains-any', skillsToLearn)
    );
    
    const querySnapshot1 = await getDocs(q1);
    const potentialMatches = new Map();
    
    // Process first query results
    querySnapshot1.forEach((doc) => {
      if (doc.id !== currentUserId && !connectedUserIds.has(doc.id)) {
        const userData = doc.data();
        const commonSkillsHave = userData.skillsHave?.filter(skill => 
          skillsToLearn.includes(skill)
        ) || [];
        
        if (commonSkillsHave.length > 0) {
          potentialMatches.set(doc.id, {
            id: doc.id,
            ...userData,
            commonSkillsHave,
            commonSkillsToLearn: []
          });
        }
      }
    });
    
    // Second query: Find users who want to learn skills the current user has
    const q2 = query(
      usersRef,
      where('skillsToLearn', 'array-contains-any', skillsHave)
    );
    
    const querySnapshot2 = await getDocs(q2);
    
    // Process second query results and merge with first
    querySnapshot2.forEach((doc) => {
      if (doc.id !== currentUserId && !connectedUserIds.has(doc.id)) {
        const userData = doc.data();
        const commonSkillsToLearn = userData.skillsToLearn?.filter(skill => 
          skillsHave.includes(skill)
        ) || [];
        
        if (commonSkillsToLearn.length > 0) {
          if (potentialMatches.has(doc.id)) {
            // User already exists from first query, add the skills they want to learn
            const existing = potentialMatches.get(doc.id);
            existing.commonSkillsToLearn = commonSkillsToLearn;
            existing.matchScore = existing.commonSkillsHave.length + commonSkillsToLearn.length;
          } else {
            // New user from second query
            potentialMatches.set(doc.id, {
              id: doc.id,
              ...userData,
              commonSkillsHave: [],
              commonSkillsToLearn,
              matchScore: commonSkillsToLearn.length
            });
          }
        }
      }
    });
    
    // Convert map to array and filter for actual matches
    const matches = Array.from(potentialMatches.values()).filter(match => 
      match.commonSkillsHave.length > 0 || match.commonSkillsToLearn.length > 0
    );
    
    // Sort by match score
    matches.sort((a, b) => b.matchScore - a.matchScore);
    
    return { success: true, data: matches };
  } catch (error) {
    console.error('Error finding matches:', error);
    return { success: false, error: error.message };
  }
};

// Match Management
export const createMatch = async (userId1, userId2) => {
  try {
    const matchRef = collection(db, 'matches');
    const matchData = {
      users: [userId1, userId2],
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLearningSession: null,
      totalSessions: 0
    };
    
    const docRef = await addDoc(matchRef, matchData);
    return { success: true, matchId: docRef.id };
  } catch (error) {
    console.error('Error creating match:', error);
    return { success: false, error: error.message };
  }
};

export const updateMatchStatus = async (matchId, status) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const updateData = {
      status,
      updatedAt: serverTimestamp()
    };
    
    // If accepting a match, also set it to connected
    if (status === 'accepted') {
      updateData.status = 'connected';
    }
    
    await updateDoc(matchRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating match status:', error);
    return { success: false, error: error.message };
  }
};

// New function to start a learning session
export const startLearningSession = async (matchId, sessionMode = 'chat') => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      status: 'in_session',
      sessionMode: sessionMode,
      lastLearningSession: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error starting learning session:', error);
    return { success: false, error: error.message };
  }
};

// New function to end a learning session
export const endLearningSession = async (matchId) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      status: 'connected',
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error ending learning session:', error);
    return { success: false, error: error.message };
  }
};

export const getUserMatches = async (userId) => {
  try {
    const matchesRef = collection(db, 'matches');
    const q = query(
      matchesRef,
      where('users', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const matches = [];
    
    querySnapshot.forEach((doc) => {
      matches.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort by updatedAt in JavaScript instead of Firestore
    matches.sort((a, b) => {
      const aTime = a.updatedAt?.toDate?.() || new Date(0);
      const bTime = b.updatedAt?.toDate?.() || new Date(0);
      return bTime - aTime; // Descending order
    });
    
    return { success: true, data: matches };
  } catch (error) {
    console.error('Error getting user matches:', error);
    return { success: false, error: error.message };
  }
};

// Notification Services
export const createMatchRequest = async (requesterId, targetUserId) => {
  try {
    // Check if a notification already exists
    const notificationsRef = collection(db, 'notifications');
    const existingQuery = query(
      notificationsRef,
      where('requesterId', '==', requesterId),
      where('targetUserId', '==', targetUserId),
      where('status', '==', 'pending')
    );
    
    const existingSnapshot = await getDocs(existingQuery);
    if (!existingSnapshot.empty) {
      return { success: false, error: 'Match request already sent' };
    }
    
    const notificationData = {
      type: 'match_request',
      requesterId,
      targetUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      read: false
    };
    
    const docRef = await addDoc(notificationsRef, notificationData);
    return { success: true, notificationId: docRef.id };
  } catch (error) {
    console.error('Error creating match request:', error);
    return { success: false, error: error.message };
  }
};

export const getUserNotifications = async (userId) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('targetUserId', '==', userId),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    const notifications = [];
    
    // Process notifications and fetch requester data
    for (const notificationDoc of querySnapshot.docs) {
      const notificationData = notificationDoc.data();
      
      // Get requester's profile data
      const requesterRef = doc(db, 'users', notificationData.requesterId);
      const requesterSnap = await getDoc(requesterRef);
      
      if (requesterSnap.exists()) {
        const requesterData = requesterSnap.data();
        notifications.push({
          id: notificationDoc.id,
          ...notificationData,
          requesterName: requesterData.name,
          requesterSkills: requesterData.skillsHave || [],
          requesterSkillsToLearn: requesterData.skillsToLearn || []
        });
      }
    }
    
    // Sort by createdAt in descending order
    notifications.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
    
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return { success: false, error: error.message };
  }
};

export const acceptMatchRequest = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    const notificationSnap = await getDoc(notificationRef);
    
    if (!notificationSnap.exists()) {
      return { success: false, error: 'Notification not found' };
    }
    
    const notification = notificationSnap.data();
    
    // Create the actual match
    const matchResult = await createMatch(notification.requesterId, notification.targetUserId);
    
    if (matchResult.success) {
      // Update the match status to connected
      const matchRef = doc(db, 'matches', matchResult.matchId);
      await updateDoc(matchRef, {
        status: 'connected',
        updatedAt: serverTimestamp()
      });
      
      // Update notification status to accepted
      await updateDoc(notificationRef, {
        status: 'accepted',
        updatedAt: serverTimestamp(),
        matchId: matchResult.matchId
      });
      
      return { success: true, matchId: matchResult.matchId };
    } else {
      return { success: false, error: matchResult.error };
    }
  } catch (error) {
    console.error('Error accepting match request:', error);
    return { success: false, error: error.message };
  }
};

export const rejectMatchRequest = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      status: 'rejected',
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting match request:', error);
    return { success: false, error: error.message };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

// File Storage Services
export const uploadFile = async (file, path) => {
  try {
    console.log('Starting upload to Firebase Storage...');
    console.log('File:', file.name, 'Size:', file.size);
    console.log('Path:', path);
    
    const storageRef = ref(storage, path);
    console.log('Storage ref created:', storageRef);
    
    // Upload with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: 'skill-share-app',
        uploadedAt: new Date().toISOString()
      }
    };
    
    console.log('Uploading with metadata:', metadata);
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log('Upload completed, getting download URL...');
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    return { success: true, downloadURL };
  } catch (error) {
    console.error('Error uploading file:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return { success: false, error: error.message };
  }
};

export const deleteFile = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

// Progress Tracking Services
export const saveCourseProgress = async (userId, courseId, progressData) => {
  try {
    const progressRef = doc(db, 'courseProgress', `${userId}_${courseId}`);
    await setDoc(progressRef, {
      userId,
      courseId,
      ...progressData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error saving course progress:', error);
    return { success: false, error: error.message };
  }
};

export const getCourseProgress = async (userId, courseId) => {
  try {
    const progressRef = doc(db, 'courseProgress', `${userId}_${courseId}`);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      return { success: true, data: progressSnap.data() };
    } else {
      return { success: true, data: null };
    }
  } catch (error) {
    console.error('Error getting course progress:', error);
    return { success: false, error: error.message };
  }
};

export const getAllUserProgress = async (userId) => {
  try {
    const progressRef = collection(db, 'courseProgress');
    const q = query(progressRef, where('userId', '==', userId));
    const progressSnapshot = await getDocs(q);
    
    const allProgress = [];
    progressSnapshot.forEach((doc) => {
      allProgress.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: allProgress };
  } catch (error) {
    console.error('Error getting all user progress:', error);
    return { success: false, error: error.message };
  }
};

export const markLessonComplete = async (userId, courseId, sectionIndex, lessonIndex, courseData = null) => {
  try {
    const progressRef = doc(db, 'courseProgress', `${userId}_${courseId}`);
    const progressSnap = await getDoc(progressRef);
    
    let progressData = {};
    if (progressSnap.exists()) {
      progressData = progressSnap.data();
    }
    
    // Initialize progress data if it doesn't exist
    if (!progressData.completedLessons) {
      progressData.completedLessons = [];
    }
    if (!progressData.currentSection) {
      progressData.currentSection = 0;
    }
    if (!progressData.currentLesson) {
      progressData.currentLesson = 0;
    }
    
    const lessonId = `${sectionIndex}-${lessonIndex}`;
    if (!progressData.completedLessons.includes(lessonId)) {
      progressData.completedLessons.push(lessonId);
    }
    
    // Calculate total lessons if course data is provided
    if (courseData && courseData.sections) {
      progressData.totalLessons = courseData.sections.reduce((total, section) => total + section.lessons.length, 0);
    }
    
    // Update current position to next lesson
    progressData.currentSection = sectionIndex;
    progressData.currentLesson = lessonIndex + 1;
    
    await setDoc(progressRef, {
      userId,
      courseId,
      ...progressData,
      updatedAt: serverTimestamp()
    });
    
    return { success: true, data: progressData };
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    return { success: false, error: error.message };
  }
};

export const updateCoursePosition = async (userId, courseId, sectionIndex, lessonIndex, courseData = null) => {
  try {
    const progressRef = doc(db, 'courseProgress', `${userId}_${courseId}`);
    
    const updateData = {
      userId,
      courseId,
      currentSection: sectionIndex,
      currentLesson: lessonIndex,
      updatedAt: serverTimestamp()
    };
    
    // Calculate total lessons if course data is provided
    if (courseData && courseData.sections) {
      updateData.totalLessons = courseData.sections.reduce((total, section) => total + section.lessons.length, 0);
    }
    
    await setDoc(progressRef, updateData, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating course position:', error);
    return { success: false, error: error.message };
  }
};

// Chat Services
export const sendMessage = async (matchId, senderId, message, type = 'text') => {
  try {
    const messagesRef = collection(db, 'matches', matchId, 'messages');
    const messageData = {
      senderId,
      message,
      type,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(messagesRef, messageData);
    return { success: true, messageId: docRef.id };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
};

export const getMessages = (matchId, callback) => {
  const messagesRef = collection(db, 'matches', matchId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, callback);
};
