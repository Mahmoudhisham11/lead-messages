import { DocumentData } from "firebase/firestore";
import {
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  bulkDelete,
  bulkUpdate,
  FirestoreDocument,
  orderBy,
  where,
} from "./firestore";

const COLLECTION = "campaigns";

export interface CreateCampaignData {
  name: string;
  messageTemplate: string;
  leadIds: string[];
  status?: string;
  scheduledAt?: Date;
}

export async function createCampaign(
  userId: string,
  data: CreateCampaignData
): Promise<ReturnType<typeof addDocument>> {
  return addDocument(COLLECTION, {
    userId,
    ...data,
    status: data.status || "draft",
    stats: {
      total: data.leadIds.length,
      sent: 0,
      delivered: 0,
      replied: 0,
      failed: 0,
    },
  });
}

export async function getCampaign(campaignId: string): Promise<FirestoreDocument | null> {
  return getDocument(COLLECTION, campaignId);
}

export async function updateCampaign(
  campaignId: string,
  data: DocumentData
): Promise<void> {
  return updateDocument(COLLECTION, campaignId, {
    ...data,
    updatedAt: new Date(),
  });
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  return deleteDocument(COLLECTION, campaignId);
}

export function subscribeToCampaigns(
  userId: string,
  callback: (campaigns: FirestoreDocument[]) => void
): () => void {
  return subscribeToCollection(
    COLLECTION,
    (campaigns) => {
      const userCampaigns = campaigns.filter((c) => c.userId === userId);
      callback(userCampaigns);
    },
    [orderBy("createdAt", "desc")]
  );
}

export async function bulkDeleteCampaigns(campaignIds: string[]): Promise<void> {
  return bulkDelete(COLLECTION, campaignIds);
}

export async function bulkUpdateCampaigns(
  updates: { id: string; data: DocumentData }[]
): Promise<void> {
  return bulkUpdate(COLLECTION, updates);
}
