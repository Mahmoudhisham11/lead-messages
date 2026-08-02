import { DocumentData } from "firebase/firestore";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./config";

const COLLECTION = "users";

export async function createUser(
  userId: string,
  data: DocumentData
): Promise<void> {
  return setDoc(doc(db, COLLECTION, userId), {
    ...data,
    createdAt: new Date().toISOString(),
  });
}

export async function getUser(userId: string): Promise<DocumentData | null> {
  const docSnap = await getDoc(doc(db, COLLECTION, userId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function updateUser(
  userId: string,
  data: DocumentData
): Promise<void> {
  return updateDoc(doc(db, COLLECTION, userId), data);
}

export async function getUserOrCreate(
  userId: string,
  data: DocumentData
): Promise<DocumentData> {
  const existing = await getUser(userId);
  if (existing) return existing;
  await createUser(userId, data);
  return { id: userId, ...data };
}
