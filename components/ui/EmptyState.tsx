import { IconType } from "react-icons";

interface EmptyStateProps {
  icon?: IconType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        textAlign: "center",
      }}
    >
      {Icon && (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-full)",
            background: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            color: "var(--text-tertiary)",
          }}
        >
          <Icon size={28} />
        </div>
      )}

      {title && (
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          {title}
        </h3>
      )}

      {description && (
        <p style={{ color: "var(--text-secondary)", fontSize: 13, maxWidth: 360, lineHeight: 1.5 }}>
          {description}
        </p>
      )}

      {action && <div style={{ marginTop: 18 }}>{action}</div>}

      {!action && actionLabel && onAction && (
        <div style={{ marginTop: 18 }}>
          <button className="btn btn-primary" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
