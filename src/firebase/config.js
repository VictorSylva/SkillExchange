import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBVias4NeIRiSdzzPf0v2DWIcWVryJf-mU",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "skillshare-f8520.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "skillshare-f8520",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "skillshare-f8520.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "50034795118",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:50034795118:web:7f0c4a6574a5636ea57c7f",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-LBHG0TLJ65"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
