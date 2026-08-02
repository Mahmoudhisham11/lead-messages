import { LeadStatus } from "@/types/lead";
import { getStatusCssClass, getStatusLabel } from "@/lib/utils/status";

interface BadgeProps {
  status?: LeadStatus;
  children?: React.ReactNode;
  variant?: "status" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

export default function Badge({ status, children, variant = "status", className = "" }: BadgeProps) {
  if (variant === "status" && status) {
    return (
      <span className={`status-badge ${getStatusCssClass(status)} ${className}`}>
        {getStatusLabel(status)}
      </span>
    );
  }

  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}
