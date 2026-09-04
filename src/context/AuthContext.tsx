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
import { auth, googleProvider } from "../lib/firebase";

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<UserCredential | void>;
  signInRedirect: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Check for redirect sign-in result if returning from a redirect
    getRedirectResult(auth)
      .then((cred) => {
        if (cred?.user) {
          setUser(cred.user);
        }
      })
      .catch((err) => {
        console.warn("Redirect sign-in check result:", err);
      });

    // Safety timeout — if auth never resolves in 3s, stop loading anyway
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    try {
      unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
        clearTimeout(timeout);
        setUser(firebaseUser);
        setLoading(false);
      }, (error) => {
        clearTimeout(timeout);
        console.error("Auth state listener error", error);
        setLoading(false);
      });
    } catch (e) {
      clearTimeout(timeout);
      console.error("Failed to initialize auth listener", e);
      setLoading(false);
    }

    return () => {
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, []);

  const signIn = async (): Promise<UserCredential | void> => {
    try {
      console.log("[Auth] Initiating Google popup sign-in...");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("[Auth] Google popup sign-in successful:", result.user.email);
      return result;
    } catch (e: any) {
      console.error("[Auth] Google popup sign-in error:", e);
      // If popup was blocked by browser, try redirect flow automatically
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request') {
        console.warn("[Auth] Popup blocked by browser. Falling back to redirect flow...");
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw e;
    }
  };

  const signInRedirect = async (): Promise<void> => {
    console.log("[Auth] Initiating Google redirect sign-in...");
    await signInWithRedirect(auth, googleProvider);
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error("[Auth] Sign‑out error", e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInRedirect, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
