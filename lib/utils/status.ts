import { LeadStatus, STATUS_LABELS, STATUS_COLORS } from "@/services/firebase/leads";

export function getStatusColor(status: LeadStatus): string {
  return STATUS_COLORS[status]?.color || "var(--primary)";
}

export function getStatusLabel(status: LeadStatus): string {
  return STATUS_LABELS[status] || status;
}

export function getStatusCssClass(status: string): string {
  return status || "following";
}
