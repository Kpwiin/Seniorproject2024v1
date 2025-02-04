// Import required Firebase modules
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCJtWEjzDM_gwgVMqLSscli7B88szGHvvQ",
  authDomain: "noise-monitoring-system-5c950.firebaseapp.com",
  projectId: "noise-monitoring-system-5c950",
  storageBucket: "noise-monitoring-system-5c950.appspot.com",
  messagingSenderId: "190596141828",
  appId: "1:190596141828:web:8bdc5006456f7c5771b651",
  measurementId: "G-7XRVXJDVQE"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

