// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAgzXYlC2J7QaYK-uCoIAinXpJfZOrQwrk",
    authDomain: "open-hoot.firebaseapp.com",
    projectId: "open-hoot",
    storageBucket: "open-hoot.firebasestorage.app",
    messagingSenderId: "741706643693",
    appId: "1:741706643693:web:96215007687744664af4e4",
    measurementId: "G-Y53QS3C4JX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);