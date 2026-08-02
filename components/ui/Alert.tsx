import { useEffect } from "react";
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineInformationCircle,
  HiOutlineXCircle,
} from "react-icons/hi2";
import { IconType } from "react-icons";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  message: string;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  dismissDelay?: number;
  className?: string;
}

const VARIANTS: Record<AlertVariant, { icon: IconType; className: string }> = {
  success: {
    icon: HiOutlineCheckCircle,
    className: "alert-success",
  },
  error: {
    icon: HiOutlineXCircle,
    className: "alert-error",
  },
  warning: {
    icon: HiOutlineExclamationTriangle,
    className: "alert-warning",
  },
  info: {
    icon: HiOutlineInformationCircle,
    className: "alert-info",
  },
};

export default function Alert({
  variant = "info",
  message,
  onDismiss,
  autoDismiss = false,
  dismissDelay = 5000,
  className = "",
}: AlertProps) {
  const { icon: Icon, className: variantClass } = VARIANTS[variant];

  useEffect(() => {
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(onDismiss, dismissDelay);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss, dismissDelay]);

  if (!message) return null;

  return (
    <div className={`${variantClass} ${className}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={18} />
      <span style={{ flex: 1 }}>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          ×
        </button>
      )}
    </div>
  );
}
