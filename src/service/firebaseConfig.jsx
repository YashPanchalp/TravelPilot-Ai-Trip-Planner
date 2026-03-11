// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDQcHi0cRvtwOQfoIjInFVTBXyncmgCEf0",
  authDomain: "ai-trip-planner-9423a.firebaseapp.com",
  projectId: "ai-trip-planner-9423a",
  storageBucket: "ai-trip-planner-9423a.firebasestorage.app",
  messagingSenderId: "511616125754",
  appId: "1:511616125754:web:06d21ac41fefda76a2de03",
  measurementId: "G-EMCNR0XL2N"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// const analytics = getAnalytics(app);