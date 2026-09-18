import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let dbInstance: Firestore | null = null;
try {
  dbInstance = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
} catch (err) {
  try {
    dbInstance = getFirestore(app);
  } catch (innerErr) {
    console.warn("Firestore initialization notice:", innerErr);
  }
}
export const db = dbInstance;

let authInstance: Auth | null = null;
try {
  authInstance = getAuth(app);
} catch (err) {
  console.warn("Auth initialization notice:", err);
}
export const auth = authInstance;
