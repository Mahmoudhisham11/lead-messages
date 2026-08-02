"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { openWhatsApp } from "@/lib/utils/phone";
import { HiOutlineXMark } from "react-icons/hi2";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");

  if (!isOpen) return null;

  function handleSubmit() {
    if (!name.trim() || !phone.trim()) return;
    const message = `Hi, I'm ${name.trim()} (${phone.trim()}) and I want to upgrade to Pro plan`;
    openWhatsApp("01097025743", message);
    onClose();
  }

  return (
    <div className="leads-modal-overlay" onClick={onClose}>
      <div className="leads-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="leads-modal-header">
          <h2>Upgrade to Pro</h2>
          <button className="leads-modal-close" onClick={onClose}>
            <HiOutlineXMark size={20} />
          </button>
        </div>
        <div className="leads-modal-body">
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
            Send us a WhatsApp message with your details and we&apos;ll upgrade your account.
          </p>
          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
            />
          </div>
        </div>
        <div className="leads-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!name.trim() || !phone.trim()}
          >
            Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
