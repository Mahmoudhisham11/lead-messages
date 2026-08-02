import { DocumentData } from "firebase/firestore";
import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  FirestoreDocument,
  orderBy,
} from "./firestore";

const COLLECTION = "userMessages";

export interface CreateMessageData {
  content: string;
}

export async function createMessage(
  userId: string,
  data: CreateMessageData
): Promise<ReturnType<typeof addDocument>> {
  return addDocument(COLLECTION, {
    userId,
    content: data.content.trim(),
  });
}

export async function getMessage(messageId: string): Promise<FirestoreDocument | null> {
  return getDocument(COLLECTION, messageId);
}

export async function updateMessage(
  messageId: string,
  data: DocumentData
): Promise<void> {
  return updateDocument(COLLECTION, messageId, {
    ...data,
    updatedAt: new Date(),
  });
}

export async function deleteMessage(messageId: string): Promise<void> {
  return deleteDocument(COLLECTION, messageId);
}

export function subscribeToMessages(
  userId: string,
  callback: (messages: FirestoreDocument[]) => void
): () => void {
  return subscribeToCollection(
    COLLECTION,
    (messages) => {
      const userMessages = messages.filter((msg) => msg.userId === userId);
      callback(userMessages);
    },
    [orderBy("createdAt", "desc")]
  );
}
