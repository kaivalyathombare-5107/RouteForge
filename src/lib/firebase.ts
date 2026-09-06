// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Check if Firebase is legitimately configured with valid production credentials
export const isFirebaseConfigured: boolean = Boolean(
  rawApiKey &&
  typeof rawApiKey === "string" &&
  rawApiKey.trim().length >= 30 &&
  rawApiKey.startsWith("AIza") &&
  rawApiKey !== "MY_FIREBASE_API_KEY" &&
  rawApiKey !== "placeholder-key" &&
  rawProjectId &&
  typeof rawProjectId === "string" &&
  rawProjectId.trim().length > 0 &&
  rawProjectId !== "MY_FIREBASE_PROJECT_ID"
);

const firebaseConfig = {
  apiKey: isFirebaseConfigured ? rawApiKey : "placeholder-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: rawProjectId || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.addScope('email');
    googleProviderInstance.addScope('profile');
    googleProviderInstance.addScope('openid');
    googleProviderInstance.setCustomParameters({ prompt: "select_account" });
  } catch (error) {
    console.warn("[Firebase] Initialization skipped or failed due to invalid configuration:", error);
    appInstance = null;
    authInstance = null;
    googleProviderInstance = null;
  }
}

export const app = appInstance;
export const auth = authInstance;
export const googleProvider = googleProviderInstance;
export default appInstance;

