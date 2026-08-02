export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "stopped";

export interface CampaignStats {
  total: number;
  sent: number;
  delivered: number;
  replied: number;
  failed: number;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  messageTemplate: string;
  leadIds: string[];
  status: CampaignStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  stats: CampaignStats;
  createdAt: Date;
  updatedAt?: Date;
}
