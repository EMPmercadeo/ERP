/**
 * ERP Panamá - Firebase Configuration
 * 
 * Proyecto: erppanama-62cd0
 * Servicios habilitados:
 * - Authentication (Google Sign-In)
 * - Analytics
 * 
 * Futuro:
 * - Firestore (base de datos cloud)
 * - Storage (archivos)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBBgrb9MX5sdUYgjI_f-dSVnLYauyQuuUU",
  authDomain: "erppanama-62cd0.firebaseapp.com",
  projectId: "erppanama-62cd0",
  storageBucket: "erppanama-62cd0.firebasestorage.app",
  messagingSenderId: "324968044074",
  appId: "1:324968044074:web:cb727171ce1b25a4455553",
  measurementId: "G-R5P3LQNJNL"
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth exports
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account' // Always show account selection
});

export { app };
export default app;
