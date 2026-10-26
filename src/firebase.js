
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDKq4V1P72TgdQ51frqYITB4O11xmLjw7s",
  authDomain: "skillswap-69d22.firebaseapp.com",
  projectId: "skillswap-69d22",
  storageBucket: "skillswap-69d22.firebasestorage.app",
  messagingSenderId: "349080121215",
  appId: "1:349080121215:web:a7027d057f9aadcd85744a",
  measurementId: "G-EGE4QZF52P",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
