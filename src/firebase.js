// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALbul3z4vBS2X2_NguHqkzSA6gE1kcGdY",
  authDomain: "planificador-docente-a0513.firebaseapp.com",
  projectId: "planificador-docente-a0513",
  storageBucket: "planificador-docente-a0513.firebasestorage.app",
  messagingSenderId: "101578575530",
  appId: "1:101578575530:web:6b5837a2bf198045c7cad3",
  measurementId: "G-B2BB0CW1TL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);