import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDqDVIXo50D7rtTploSCyGWQG0kbiszsmw",
  authDomain: "safistore-v3.firebaseapp.com",
  projectId: "safistore-v3",
  storageBucket: "safistore-v3.firebasestorage.app",
  messagingSenderId: "734794260459",
  appId: "1:734794260459:web:f8ce2666973ee2e47c83ae",
  measurementId: "G-27GFC2K4NY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
