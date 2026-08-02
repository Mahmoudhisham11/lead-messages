import {
  DocumentData,
  QueryConstraint,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./config";

export type FirestoreDocument = DocumentData & { id: string };

function docToFirestore(docSnap: QueryDocumentSnapshot): FirestoreDocument {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.() || new Date(),
  };
}

export async function getDocument(
  collectionName: string,
  docId: string
): Promise<FirestoreDocument | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as FirestoreDocument;
}

export async function setDocument(
  collectionName: string,
  docId: string,
  data: DocumentData
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  return setDoc(docRef, data);
}

export async function addDocument(
  collectionName: string,
  data: DocumentData
): Promise<ReturnType<typeof addDoc>> {
  const colRef = collection(db, collectionName);
  return addDoc(colRef, { ...data, createdAt: serverTimestamp() });
}

export async function updateDocument(
  collectionName: string,
  docId: string,
  data: DocumentData
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  return updateDoc(docRef, data);
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  return deleteDoc(docRef);
}

export function subscribeToCollection(
  collectionName: string,
  callback: (data: FirestoreDocument[]) => void,
  queryConstraints: QueryConstraint[] = []
): () => void {
  const colRef = collection(db, collectionName);
  const q = query(colRef, ...queryConstraints);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(docToFirestore);
    callback(data);
  });
}

export function subscribeToDocument(
  collectionName: string,
  docId: string,
  callback: (data: FirestoreDocument | null) => void
): () => void {
  const docRef = doc(db, collectionName, docId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as FirestoreDocument);
    } else {
      callback(null);
    }
  });
}

export async function queryCollection(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<FirestoreDocument[]> {
  const colRef = collection(db, collectionName);
  const q = query(colRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToFirestore);
}

export async function bulkDelete(
  collectionName: string,
  docIds: string[]
): Promise<void> {
  const batch = writeBatch(db);
  docIds.forEach((id) => {
    const docRef = doc(db, collectionName, id);
    batch.delete(docRef);
  });
  return batch.commit();
}

export async function bulkUpdate(
  collectionName: string,
  updates: { id: string; data: DocumentData }[]
): Promise<void> {
  const batch = writeBatch(db);
  updates.forEach(({ id, data }) => {
    const docRef = doc(db, collectionName, id);
    batch.update(docRef, data);
  });
  return batch.commit();
}

export { serverTimestamp, orderBy, where, limit };
