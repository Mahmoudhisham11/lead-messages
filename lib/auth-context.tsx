"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "./firebase";

interface AuthUser {
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
  canSendMessage: () => true,
  incrementMessageCount: async () => {},
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function buildAuthUser(firebaseUser: FirebaseUser, userData: Record<string, unknown>): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName || (userData.name as string) || null,
    photoURL: firebaseUser.photoURL,
    name: userData.name as string | undefined,
    plan: (userData.plan as "free" | "pro") || "free",
    messagesSentToday: (userData.messagesSentToday as number) || 0,
    lastMessageDate: (userData.lastMessageDate as string) || "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);

        // Set default fields for new users
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            plan: "free",
            messagesSentToday: 0,
            lastMessageDate: "",
            createdAt: new Date().toISOString(),
            provider: "email",
          });
        } else {
          // Ensure plan field exists for existing users
          const data = userDoc.data();
          if (!data.plan) {
            await updateDoc(userRef, { plan: "free", messagesSentToday: 0, lastMessageDate: "" });
          }
        }

        // Real-time listener on user document
        const unsubUser = onSnapshot(userRef, (snap) => {
          const data = snap.data();
          if (data) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || data.name,
              photoURL: firebaseUser.photoURL,
              name: data.name,
              plan: data.plan || "free",
              messagesSentToday: data.messagesSentToday || 0,
              lastMessageDate: data.lastMessageDate || "",
            });
          }
        });

        setLoading(false);
        return () => unsubUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", result.user.uid), {
        name: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        plan: "free",
        messagesSentToday: 0,
        lastMessageDate: "",
        createdAt: new Date().toISOString(),
        provider: "google",
      });
    }
    return result;
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
      await updateDoc(userRef, { messagesSentToday: user.messagesSentToday + 1 });
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
    canSendMessage,
    incrementMessageCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
