"use client";

import { openWhatsApp } from "@/lib/utils/phone";
import { getTimeAgo } from "@/lib/utils/time";
import { getStatusCssClass, getStatusLabel } from "@/lib/utils/status";
import { HiOutlinePhone, HiOutlineChatBubbleLeft } from "react-icons/hi2";
import { FirestoreDocument } from "@/services/firebase/firestore";

interface LeadCardProps {
  lead: FirestoreDocument;
  onClick?: () => void;
}

export default function LeadCard({ lead, onClick }: LeadCardProps) {
  return (
    <div
      className="lead-card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="lead-avatar">
        <span className="lead-avatar-placeholder">
          {lead.phones?.[0]?.slice(-2) || "??"}
        </span>
      </div>
      <div className="lead-info">
        <div className="lead-header">
          <span className="lead-name">
            {lead.name || lead.phones?.[0] || "Unknown"}
          </span>
          <span className="lead-time">
            {getTimeAgo(lead.createdAt)}
          </span>
        </div>
        <p className="lead-property">
          {lead.message?.substring(0, 50)}
          {lead.message?.length > 50 ? "..." : ""}
        </p>
        <div className="lead-footer">
          <span className={`status-badge ${getStatusCssClass(lead.status)}`}>
            {getStatusLabel(lead.status)}
          </span>
          <div className="lead-actions">
            <button
              className="lead-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                openWhatsApp(lead.phones?.[0], lead.message);
              }}
              title="Call"
            >
              <HiOutlinePhone size={16} />
            </button>
            <button
              className="lead-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                openWhatsApp(lead.phones?.[0], lead.message);
              }}
              title="Message"
            >
              <HiOutlineChatBubbleLeft size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
