import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD4ghqovg0m5c89km2BvTXqCATETU1_NdI",
  authDomain: "logindemoapp-ff8f1.firebaseapp.com",
  projectId: "logindemoapp-ff8f1",
  storageBucket: "logindemoapp-ff8f1.firebasestorage.app",
  messagingSenderId: "37540191165",
  appId: "1:37540191165:web:269629ce70af4c5bc9d0d4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);