"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getLead, updateLead, deleteLead, LEAD_STATUSES } from "@/services/firebase/leads";
import { openWhatsApp, formatPhoneForWhatsApp } from "@/lib/utils/phone";
import { getTimeAgo } from "@/lib/utils/time";
import { getStatusCssClass, getStatusLabel } from "@/lib/utils/status";
import { STATUS_LABELS } from "@/services/firebase/leads";
import { FirestoreDocument } from "@/services/firebase/firestore";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import Alert from "@/components/ui/Alert";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  HiOutlinePhone,
  HiOutlineChatBubbleLeft,
  HiOutlineTrash,
  HiOutlineArrowLeft,
} from "react-icons/hi2";

function LeadDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<FirestoreDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);

  useEffect(() => {
    if (!user || !leadId) return;
    async function fetchLead() {
      try {
        const data = await getLead(leadId);
        if (data && data.userId === user?.uid) { setLead(data); } else { setError("Lead not found"); }
      } catch { setError("Failed to load lead"); } finally { setLoading(false); }
    }
    fetchLead();
  }, [user, leadId]);

  async function handleStatusChange(newStatus: string) {
    if (!lead) return;
    try {
      await updateLead(lead.id, { status: newStatus });
      setLead({ ...lead, status: newStatus });
      setEditingStatus(false);
      setSuccess("Status updated");
    } catch { setError("Failed to update status"); }
  }

  async function handleDelete() {
    if (!lead) return;
    setDeleting(true);
    try { await deleteLead(lead.id); router.push("/crm/leads"); } catch { setError("Failed to delete lead"); setDeleting(false); }
  }

  if (loading) {
    return (
      <div className="logip-layout">
        <Sidebar active="leads" />
        <main className="logip-main" style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <div className="logip-spinner" />
        </main>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="logip-layout">
        <Sidebar active="leads" />
        <main className="logip-main">
          <Alert variant="error" message={error || "Lead not found"} />
          <button className="btn btn-secondary" onClick={() => router.back()} style={{ marginTop: 16 }}>Go Back</button>
        </main>
      </div>
    );
  }

  return (
    <div className="logip-layout">
      <Sidebar active="leads" />

      <main className="logip-main">
        <div className="logip-header">
          <div className="logip-header-left">
            <button className="logip-back-btn" onClick={() => router.back()}>
              <HiOutlineArrowLeft size={20} />
            </button>
            <div>
              <h1 className="logip-greeting">{lead.name || "Unknown"}</h1>
              <p className="logip-subtitle">{lead.phone || "No phone"}</p>
            </div>
          </div>
          <div className="logip-header-right">
            <button className="btn btn-ghost" onClick={() => setShowDeleteDialog(true)} style={{ color: "var(--red)" }}>
              <HiOutlineTrash size={16} /> Delete
            </button>
          </div>
        </div>

        {success && <Alert variant="success" message={success} onDismiss={() => setSuccess("")} autoDismiss />}
        {error && <Alert variant="error" message={error} onDismiss={() => setError("")} />}

        <div className="logip-card">
          <div className="logip-card-header">
            <h2>Lead Info</h2>
            <span
              className={`logip-badge status-badge logip-detail-badge ${getStatusCssClass(lead.status)}`}
              onClick={() => setEditingStatus(!editingStatus)}
            >
              {getStatusLabel(lead.status)}
            </span>
          </div>

          {editingStatus && (
            <div className="logip-status-grid">
              {LEAD_STATUSES.map((s) => (
                <button
                  key={s}
                  className={`btn ${lead.status === s ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => handleStatusChange(s)}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}

          <div className="logip-btn-group">
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => openWhatsApp(lead.phone, "")}>
              <HiOutlineChatBubbleLeft size={16} /> WhatsApp
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => window.open("tel:" + formatPhoneForWhatsApp(lead.phone))}>
              <HiOutlinePhone size={16} /> Call
            </button>
          </div>
        </div>

        <div className="logip-card">
          <div className="logip-card-header"><h2>Details</h2></div>
          <div className="logip-detail-grid">
            <div className="logip-detail-row">
              <span className="logip-detail-label">Phone</span>
              <span className="logip-detail-value">{lead.phone || "-"}</span>
            </div>
            <div className="logip-detail-row">
              <span className="logip-detail-label">Status</span>
              <span className="logip-detail-value">{getStatusLabel(lead.status)}</span>
            </div>
            <div className="logip-detail-row">
              <span className="logip-detail-label">Created</span>
              <span className="logip-detail-value">{getTimeAgo(lead.createdAt)}</span>
            </div>
          </div>
        </div>
      </main>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}

export default function LeadDetailPage() {
  return (
    <AuthGuard>
      <LeadDetailContent />
    </AuthGuard>
  );
}
