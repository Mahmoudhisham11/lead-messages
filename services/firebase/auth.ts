import {
  User,
  UserCredential,
  updateProfile as firebaseUpdateProfile,
} from "firebase/auth";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "./config";

export type AuthChangeCallback = (user: User | null) => void;

export function onAuthChange(callback: AuthChangeCallback): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<UserCredential> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await firebaseUpdateProfile(result.user, { displayName: name });
  return result;
}

export async function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider);
}

export async function logout(): Promise<void> {
  return signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

export async function updateUserProfile(
  data: { displayName?: string; photoURL?: string }
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  return firebaseUpdateProfile(user, data);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}
