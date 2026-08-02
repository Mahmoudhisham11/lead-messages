export type NotificationType =
  | "campaign"
  | "import"
  | "follow-up"
  | "system";

export type NotificationStatus = "unread" | "read";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  link?: string;
  createdAt: Date;
}
