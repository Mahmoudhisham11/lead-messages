import { DocumentData } from "firebase/firestore";
import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  FirestoreDocument,
  orderBy,
  where,
} from "./firestore";

const COLLECTION = "followups";

export interface CreateFollowUpData {
  leadId: string;
  type: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  priority?: string;
}

export async function createFollowUp(
  userId: string,
  data: CreateFollowUpData
): Promise<ReturnType<typeof addDocument>> {
  return addDocument(COLLECTION, {
    userId,
    ...data,
    status: "pending",
    priority: data.priority || "medium",
  });
}

export async function getFollowUp(followUpId: string): Promise<FirestoreDocument | null> {
  return getDocument(COLLECTION, followUpId);
}

export async function updateFollowUp(
  followUpId: string,
  data: DocumentData
): Promise<void> {
  return updateDocument(COLLECTION, followUpId, {
    ...data,
    updatedAt: new Date(),
  });
}

export async function deleteFollowUp(followUpId: string): Promise<void> {
  return deleteDocument(COLLECTION, followUpId);
}

export function subscribeToFollowUps(
  userId: string,
  callback: (followUps: FirestoreDocument[]) => void
): () => void {
  return subscribeToCollection(
    COLLECTION,
    (followUps) => {
      const userFollowUps = followUps.filter((f) => f.userId === userId);
      callback(userFollowUps);
    },
    [orderBy("scheduledAt", "desc")]
  );
}

export async function completeFollowUp(followUpId: string): Promise<void> {
  return updateDocument(COLLECTION, followUpId, {
    status: "completed",
    completedAt: new Date(),
    updatedAt: new Date(),
  });
}

export function getTodayFollowUps(userId: string): () => void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return subscribeToCollection(
    COLLECTION,
    (followUps) => followUps,
    [
      where("userId", "==", userId),
      where("scheduledAt", ">=", today),
      where("scheduledAt", "<", tomorrow),
      orderBy("scheduledAt", "asc"),
    ]
  );
}
