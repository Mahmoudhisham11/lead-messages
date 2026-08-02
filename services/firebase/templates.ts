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

const COLLECTION = "templates";

export interface CreateTemplateData {
  name: string;
  content: string;
  category: string;
  isFavorite?: boolean;
  variables?: string[];
}

export async function createTemplate(
  userId: string,
  data: CreateTemplateData
): Promise<ReturnType<typeof addDocument>> {
  return addDocument(COLLECTION, {
    userId,
    ...data,
    isFavorite: data.isFavorite || false,
    variables: data.variables || [],
  });
}

export async function getTemplate(templateId: string): Promise<FirestoreDocument | null> {
  return getDocument(COLLECTION, templateId);
}

export async function updateTemplate(
  templateId: string,
  data: DocumentData
): Promise<void> {
  return updateDocument(COLLECTION, templateId, {
    ...data,
    updatedAt: new Date(),
  });
}

export async function deleteTemplate(templateId: string): Promise<void> {
  return deleteDocument(COLLECTION, templateId);
}

export function subscribeToTemplates(
  userId: string,
  callback: (templates: FirestoreDocument[]) => void
): () => void {
  return subscribeToCollection(
    COLLECTION,
    (templates) => {
      const userTemplates = templates.filter((t) => t.userId === userId);
      callback(userTemplates);
    },
    [orderBy("createdAt", "desc")]
  );
}

export async function toggleFavorite(
  templateId: string,
  isFavorite: boolean
): Promise<void> {
  return updateDocument(COLLECTION, templateId, {
    isFavorite: !isFavorite,
    updatedAt: new Date(),
  });
}
