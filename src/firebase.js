import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBJdFuYDuzuKvg0vhfuZMCmufDygkg684s",
  authDomain: "dcsaeat.firebaseapp.com",
  projectId: "dcsaeat",
  storageBucket: "dcsaeat.firebasestorage.app",
  messagingSenderId: "882030543934",
  appId: "1:882030543934:web:7b78cb7fc767a4aada3d6f",
  measurementId: "G-NE0EWV5P7F",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
