// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyYsqHOf2ADyT4k7RFN2EQVL-8byIT4d8",
  authDomain: "vaultiq-aa861.firebaseapp.com",
  projectId: "vaultiq-aa861",
  storageBucket: "vaultiq-aa861.firebasestorage.app",
  messagingSenderId: "884277425749",
  appId: "1:884277425749:web:6492357280d4556a4206dc",
  measurementId: "G-4SY8DLZZGL"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
