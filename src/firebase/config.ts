import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for Graminum Natural Products
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDIouI6K5CYZAjVPde1Yvus3PIek6d8D4U',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'graminum-organic-foods.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'graminum-organic-foods',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'graminum-organic-foods.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '530118920285',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:530118920285:web:2327341d638878d11d25b4',
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, db, googleProvider, signInWithPopup, fbSignOut, sendPasswordResetEmail };
