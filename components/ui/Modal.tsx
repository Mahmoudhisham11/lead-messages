import { useEffect, useRef } from "react";
import { HiOutlineXMark } from "react-icons/hi2";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) {
      onClose();
    }
  }

  const sizeClasses = {
    sm: "modal-sm",
    md: "modal-md",
    lg: "modal-lg",
  };

  return (
    <div
      ref={overlayRef}
      className={`modal-overlay ${className}`}
      onClick={handleOverlayClick}
    >
      <div className={`modal-content ${sizeClasses[size]}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <HiOutlineXMark size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
