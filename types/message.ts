export type MessageStatus = "sent" | "delivered" | "read" | "failed";

export interface Message {
  id: string;
  userId: string;
  message: string;
  phones: string[];
  phoneCount: number;
  status: MessageStatus;
  leadId?: string;
  campaignId?: string;
  createdAt: Date;
}
