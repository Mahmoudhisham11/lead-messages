import { IconType } from "react-icons";

interface EmptyStateProps {
  icon?: IconType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      {Icon && (
        <Icon
          size={48}
          style={{ color: "var(--text-muted)", marginBottom: 12 }}
        />
      )}
      {title && (
        <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          {title}
        </p>
      )}
      {description && (
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
