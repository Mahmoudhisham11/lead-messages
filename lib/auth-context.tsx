"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  name?: string;
  plan: "free" | "pro";
  messagesSentToday: number;
  lastMessageDate: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signup: (email: string, password: string, name: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  updateUserPlan: (plan: "free" | "pro") => Promise<void>;
  activatePromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  canSendMessage: () => boolean;
  incrementMessageCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signup: async () => {},
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  updateUserPlan: async () => {},
  activatePromoCode: async () => ({ success: false, message: "" }),
  canSendMessage: () => true,
  incrementMessageCount: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);

        unsubscribeFirestore = onSnapshot(
          userRef,
          async (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const rawPlan = String(data.plan || "free").trim().toLowerCase();
              const normalizedPlan: "free" | "pro" = rawPlan === "pro" ? "pro" : "free";

              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || data.name || "User",
                photoURL: firebaseUser.photoURL,
                name: data.name,
                plan: normalizedPlan,
                messagesSentToday: data.messagesSentToday || 0,
                lastMessageDate: data.lastMessageDate || "",
              });
            } else {
              // Create default document if it doesn't exist
              const initialData = {
                name: firebaseUser.displayName || "User",
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL,
                plan: "free",
                messagesSentToday: 0,
                lastMessageDate: "",
                createdAt: new Date().toISOString(),
                provider: firebaseUser.providerData?.[0]?.providerId || "email",
              };
              await setDoc(userRef, initialData);
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: initialData.name,
                photoURL: firebaseUser.photoURL,
                name: initialData.name,
                plan: "free",
                messagesSentToday: 0,
                lastMessageDate: "",
              });
            }
            setLoading(false);
          },
          (err) => {
            console.error("Firestore user sync error:", err);
            // Fallback user from Firebase Auth
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || "User",
              photoURL: firebaseUser.photoURL,
              plan: "free",
              messagesSentToday: 0,
              lastMessageDate: "",
            });
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  async function signup(email: string, password: string, name: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await setDoc(doc(db, "users", result.user.uid), {
      name,
      email,
      plan: "free",
      messagesSentToday: 0,
      lastMessageDate: "",
      createdAt: new Date().toISOString(),
      provider: "email",
    });
    return result;
  }

  async function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
  }

  async function updateUserPlan(plan: "free" | "pro") {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { plan });
  }

  async function activatePromoCode(code: string): Promise<{ success: boolean; message: string }> {
    if (!user) return { success: false, message: "Not authenticated" };
    const cleanCode = code.trim().toUpperCase();

    const validProCodes = ["PRO2026", "VIP", "ADMIN", "LEADPRO", "UNLIMITED"];

    if (validProCodes.includes(cleanCode)) {
      await updateUserPlan("pro");
      return { success: true, message: "Pro plan activated successfully! Unlimited messaging enabled." };
    }

    return { success: false, message: "Invalid promo code. Please check and try again." };
  }

  const canSendMessage = useCallback((): boolean => {
    if (!user) return false;
    if (user.plan === "pro") return true;
    const today = getToday();
    if (user.lastMessageDate !== today) return true;
    return user.messagesSentToday < 5;
  }, [user]);

  async function incrementMessageCount() {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const today = getToday();

    if (user.lastMessageDate !== today) {
      await updateDoc(userRef, { messagesSentToday: 1, lastMessageDate: today });
    } else {
      await updateDoc(userRef, { messagesSentToday: (user.messagesSentToday || 0) + 1 });
    }
  }

  const value: AuthContextValue = {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserPlan,
    activatePromoCode,
    canSendMessage,
    incrementMessageCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
