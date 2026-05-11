import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAkays5p9HBCZAObrQZSZRTFR0riRS-bMw",
    authDomain: "berkysdaycare2-98966.firebaseapp.com",
    projectId: "berkysdaycare2-98966",
    storageBucket: "berkysdaycare2-98966.firebasestorage.app",
    messagingSenderId: "209620291889",
    appId: "1:209620291889:web:c49fe1cd8f2743b6f96010"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);