import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBqSI7llCuPLE2bGFiCzcAbSu_pNS429fw",
  authDomain: "rp-encyclopedia.firebaseapp.com",
  databaseURL: "https://rp-encyclopedia-default-rtdb.firebaseio.com",
  projectId: "rp-encyclopedia",
  storageBucket: "rp-encyclopedia.appspot.com",
  messagingSenderId: "869065784455",
  appId: "1:869065784455:web:10a0c69a57854b8a098c22"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;