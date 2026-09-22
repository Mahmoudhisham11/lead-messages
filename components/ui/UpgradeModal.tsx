"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { openWhatsApp } from "@/lib/utils/phone";
import { HiOutlineXMark, HiOutlineSparkles } from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";

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
    const message = `Hi! I'm ${name.trim()} (${phone.trim()}) and I would like to upgrade my Lead Messages account to the Pro Plan.`;
    openWhatsApp("01097025743", message);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HiOutlineSparkles size={20} color="#f59e0b" />
            <h3>Upgrade to Pro Plan</h3>
          </div>
          <button className="btn-ghost btn-icon" onClick={onClose}>
            <HiOutlineXMark size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ 
            background: "#f8fafc", 
            padding: "14px", 
            borderRadius: "var(--radius-md)", 
            marginBottom: "18px",
            border: "1px solid var(--border-default)"
          }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: "var(--text-primary)" }}>
              🚀 Pro Features Include:
            </div>
            <ul style={{ fontSize: 12, color: "var(--text-secondary)", paddingLeft: 16, lineHeight: 1.6 }}>
              <li>Unlimited WhatsApp messages per day</li>
              <li>Priority support & instant feature updates</li>
              <li>Full CRM lead tracking without restrictions</li>
            </ul>
          </div>

          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mahmoud Hisham"
            />
          </div>

          <div className="form-group">
            <label>Phone Number (WhatsApp)</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010xxxxxxxx"
              dir="ltr"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={!name.trim() || !phone.trim()}
          >
            <FaWhatsapp size={16} /> Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
