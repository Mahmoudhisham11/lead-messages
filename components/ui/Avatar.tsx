interface AvatarProps {
  name?: string;
  phone?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Avatar({ name, phone, size = "md", className = "" }: AvatarProps) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : phone?.slice(-2) || "??";

  const sizeClasses = {
    sm: "avatar-sm",
    md: "avatar-md",
    lg: "avatar-lg",
  };

  return (
    <div className={`avatar ${sizeClasses[size]} ${className}`}>
      <span className="avatar-initials">{initials}</span>
    </div>
  );
}
