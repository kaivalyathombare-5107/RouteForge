// src/context/AuthContext.tsx
import React, { createContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  onIdTokenChanged, 
  signOut as firebaseSignOut, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  UserCredential
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "../lib/firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

const DEFAULT_VIP_USER: AuthUser = {
  uid: "eKCtV6q61wgi7edQaQ3tC8W7D9t1",
  email: "kaivalyathombare5@gmail.com",
  displayName: "Kaivalya Thombare",
  photoURL: null,
  getIdToken: async () => "demo-vip-token-" + Date.now(),
};

const SESSION_STORAGE_KEY = "routeforge_auth_session";
const LEGACY_SESSION_STORAGE_KEY = "routeforge_auth_session";

interface AuthContextProps {
  user: User | AuthUser | null;
  loading: boolean;
  isFirebaseReady: boolean;
  signIn: () => Promise<UserCredential | { user: AuthUser } | void>;
  signInWithDemo: (customUser?: Partial<AuthUser>) => Promise<AuthUser>;
  signInRedirect: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Check for a stored demo session (sessionStorage or localStorage)
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.uid) {
          parsed.getIdToken = async () => 'demo-vip-token-' + Date.now();
          setUser(parsed);
          setLoading(false);
        }
      }
    } catch (e) {
      console.warn("[Auth] Failed parsing stored session:", e);
    }

    // 2. If Firebase auth is not configured or unavailable, stop loading immediately
    if (!auth || !isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    // Check for redirect sign-in result if returning from a redirect
    getRedirectResult(auth)
      .then((cred) => {
        if (cred?.user) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          setUser(cred.user);
        }
      })
      .catch((err) => {
        console.warn("[Auth] Redirect sign-in check result:", err);
      });

    // Safety timeout — if auth never resolves in 2.5s, stop loading anyway
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2500);

    try {
      unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
        clearTimeout(timeout);
        if (firebaseUser) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          setUser(firebaseUser);
        }
        setLoading(false);
      }, (error) => {
        clearTimeout(timeout);
        console.error("[Auth] Auth state listener error:", error);
        setLoading(false);
      });
    } catch (e) {
      clearTimeout(timeout);
      console.error("[Auth] Failed to initialize auth listener:", e);
      setLoading(false);
    }

    return () => {
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, []);

  const signIn = async (): Promise<UserCredential | { user: AuthUser } | void> => {
    // If Firebase Auth is fully initialized and configured
    if (auth && googleProvider && isFirebaseConfigured) {
      try {
        console.log("[Auth] Initiating Google popup sign-in...");
        const result = await signInWithPopup(auth, googleProvider);
        console.log("[Auth] Google popup sign-in successful:", result.user.email);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setUser(result.user);
        return result;
      } catch (e: any) {
        console.warn("[Auth] Google popup sign-in error:", e?.code || e?.message);
        if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request') {
          console.warn("[Auth] Popup blocked by browser. Falling back to redirect flow...");
          try {
            await signInWithRedirect(auth, googleProvider);
            return;
          } catch (redirectErr) {
            console.warn("[Auth] Redirect fallback error:", redirectErr);
          }
        }
        // Do not silently sign in as the demo owner when a real account fails.
        throw e;
      }
    }

    // Graceful fallback when Firebase API key has not been entered yet in .env
    console.info("[Auth] Firebase not configured with live credentials. Logging in with VIP Privé profile.");
    const demoUser = await signInWithDemo();
    return { user: demoUser };
  };

  const signInWithDemo = async (customUser?: Partial<AuthUser>): Promise<AuthUser> => {
    const demoAccount: AuthUser = {
      ...DEFAULT_VIP_USER,
      ...customUser,
    };
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(demoAccount));
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(demoAccount));
    } catch (e) {
      console.warn("[Auth] Failed to persist demo session in storage", e);
    }
    setUser(demoAccount);
    return demoAccount;
  };

  const signInRedirect = async (): Promise<void> => {
    if (auth && googleProvider && isFirebaseConfigured) {
      console.log("[Auth] Initiating Google redirect sign-in...");
      await signInWithRedirect(auth, googleProvider);
    } else {
      await signInWithDemo();
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setUser(null);
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.error("[Auth] Sign-out error", e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isFirebaseReady: Boolean(auth && isFirebaseConfigured),
      signIn, 
      signInWithDemo,
      signInRedirect, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

