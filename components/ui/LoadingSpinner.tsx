interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "spinner-sm",
    md: "spinner-md",
    lg: "spinner-lg",
  };

  return (
    <div className={`loading-spinner ${sizeClasses[size]} ${className}`}>
      <div className="spinner" />
    </div>
  );
}
