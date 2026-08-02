export type LeadStatus =
  | "urgent"
  | "following"
  | "showing"
  | "meeting"
  | "not_interested"
  | "unreachable"
  | "done_deal"
  | "canceled"
  | "seller"
  | "buyer"
  | "postponed";

export interface Lead {
  id: string;
  userId: string;
  name: string;
  phone: string;
  status: LeadStatus;
  createdAt: Date;
  updatedAt?: Date;
}
