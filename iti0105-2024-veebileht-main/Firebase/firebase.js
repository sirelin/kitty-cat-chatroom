// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCo-YoDgE2Yf3v0LoVGPdhVutyvYf1GK4Y",
  authDomain: "iti0105-2024.firebaseapp.com",
  projectId: "iti0105-2024",
  storageBucket: "iti0105-2024.appspot.com",
  messagingSenderId: "727516669106",
  appId: "1:727516669106:web:f7fd51a0ab88675d5b15ab"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
