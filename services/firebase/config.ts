import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxt7HwkDz7t9lkTWqpAsMn3wVjLIq_Zn0",
  authDomain: "devoria-57dd4.firebaseapp.com",
  projectId: "devoria-57dd4",
  storageBucket: "devoria-57dd4.firebasestorage.app",
  messagingSenderId: "169178705677",
  appId: "1:169178705677:web:60c60c84123fc95117ca44",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
