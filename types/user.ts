export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  name?: string;
  plan: "free" | "pro";
  messagesSentToday: number;
  lastMessageDate: string;
  createdAt?: string;
  provider?: "email" | "google";
}

export interface UserProfile {
  name: string;
  email: string;
  photoURL?: string;
  plan: "free" | "pro";
  messagesSentToday: number;
  lastMessageDate: string;
  createdAt: string;
  provider: "email" | "google";
}
