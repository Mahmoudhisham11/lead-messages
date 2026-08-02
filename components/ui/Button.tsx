import { IconType } from "react-icons";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: IconType;
  iconPosition?: "left" | "right";
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = "left",
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  return (
    <button
      type={type}
      className={`btn btn-${variant} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {!loading && Icon && iconPosition === "left" && <Icon size={16} />}
      {children && <span>{children}</span>}
      {!loading && Icon && iconPosition === "right" && <Icon size={16} />}
    </button>
  );
}
