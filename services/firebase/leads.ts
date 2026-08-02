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

const COLLECTION = "leads";

export const LEAD_STATUSES = [
  "urgent",
  "following",
  "showing",
  "meeting",
  "not_interested",
  "unreachable",
  "done_deal",
  "canceled",
  "seller",
  "buyer",
  "postponed",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  urgent: "Urgent",
  following: "Following",
  showing: "Showing",
  meeting: "Meeting",
  not_interested: "Not Interested",
  unreachable: "Unreachable",
  done_deal: "Done Deal",
  canceled: "Canceled",
  seller: "Seller",
  buyer: "Buyer",
  postponed: "Postponed",
};

export const STATUS_COLORS: Record<LeadStatus, { bg: string; color: string; dot: string }> = {
  urgent: { bg: "#FEE2E2", color: "#DC2626", dot: "#DC2626" },
  following: { bg: "#DBEAFE", color: "#2563EB", dot: "#2563EB" },
  showing: { bg: "#FEF3C7", color: "#D97706", dot: "#D97706" },
  meeting: { bg: "#E0E7FF", color: "#4338CA", dot: "#4338CA" },
  not_interested: { bg: "#F3F4F6", color: "#6B7280", dot: "#6B7280" },
  unreachable: { bg: "#FEF9C3", color: "#CA8A04", dot: "#CA8A04" },
  done_deal: { bg: "#D1FAE5", color: "#059669", dot: "#059669" },
  canceled: { bg: "#FEE2E2", color: "#DC2626", dot: "#DC2626" },
  seller: { bg: "#CFFAFE", color: "#0891B2", dot: "#0891B2" },
  buyer: { bg: "#F3E8FF", color: "#7C3AED", dot: "#7C3AED" },
  postponed: { bg: "#FEF3C7", color: "#D97706", dot: "#D97706" },
};

export interface CreateLeadData {
  name: string;
  phone: string;
  status?: LeadStatus;
}

export async function createLead(
  userId: string,
  data: CreateLeadData
): Promise<ReturnType<typeof addDocument>> {
  return addDocument(COLLECTION, {
    userId,
    name: data.name.trim(),
    phone: data.phone.trim(),
    status: data.status || "following",
  });
}

export async function getLead(leadId: string): Promise<FirestoreDocument | null> {
  return getDocument(COLLECTION, leadId);
}

export async function updateLead(
  leadId: string,
  data: DocumentData
): Promise<void> {
  return updateDocument(COLLECTION, leadId, {
    ...data,
    updatedAt: new Date(),
  });
}

export async function deleteLead(leadId: string): Promise<void> {
  return deleteDocument(COLLECTION, leadId);
}

export function subscribeToLeads(
  userId: string,
  callback: (leads: FirestoreDocument[]) => void
): () => void {
  return subscribeToCollection(
    COLLECTION,
    (leads) => {
      const userLeads = leads.filter((lead) => lead.userId === userId);
      callback(userLeads);
    },
    [orderBy("createdAt", "desc")]
  );
}

export async function bulkDeleteLeads(leadIds: string[]): Promise<void> {
  return bulkDelete(COLLECTION, leadIds);
}

export async function bulkUpdateLeads(
  updates: { id: string; data: DocumentData }[]
): Promise<void> {
  return bulkUpdate(COLLECTION, updates);
}
