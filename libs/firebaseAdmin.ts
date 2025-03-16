import { initializeApp, cert, getApps, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { serviceAccount } from "@/libs/serviceAccount";
import { getFunctions } from "firebase-admin/functions";

// 🔥 Firebase Admin 초기화 로직 (중복 방지)
const firebaseConfig = {
  credential: cert(serviceAccount as ServiceAccount),
  storageBucket: "rp-encyclopedia.appspot.com",
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
  console.log("✅ Firebase Admin Initialized");
} else {
  console.log("🔥 Firebase Admin already initialized.");
}

const db = getFirestore();
const storage = getStorage();
const functions = getFunctions();

export { db, storage, functions };
