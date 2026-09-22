"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { getLead, updateLead, deleteLead, LEAD_STATUSES, STATUS_LABELS, STATUS_COLORS, type LeadStatus } from "@/services/firebase/leads";
import { openWhatsApp, formatPhoneForWhatsApp } from "@/lib/utils/phone";
import { getTimeAgo } from "@/lib/utils/time";
import { FirestoreDocument } from "@/services/firebase/firestore";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  HiOutlinePhone,
  HiOutlineTrash,
  HiOutlineArrowLeft,
  HiOutlineChevronDown,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";

function LeadDetailContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<FirestoreDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  useEffect(() => {
    if (!user || !leadId) return;
    async function fetchLead() {
      try {
        const data = await getLead(leadId);
        if (data && data.userId === user?.uid) {
          setLead(data);
        } else {
          showToast("Lead not found", "error");
        }
      } catch {
        showToast("Failed to load lead", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchLead();
  }, [user, leadId, showToast]);

  async function handleStatusChange(newStatus: LeadStatus) {
    if (!lead) return;
    try {
      await updateLead(lead.id, { status: newStatus });
      setLead({ ...lead, status: newStatus });
      setStatusDropdownOpen(false);
      showToast(`Status updated to ${STATUS_LABELS[newStatus]}`, "success");
    } catch {
      showToast("Failed to update status", "error");
    }
  }

  async function handleDelete() {
    if (!lead) return;
    setDeleting(true);
    try {
      await deleteLead(lead.id);
      showToast("Lead deleted", "success");
      router.push("/crm/leads");
    } catch {
      showToast("Failed to delete lead", "error");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="logip-layout">
        <Sidebar active="leads" />
        <main className="logip-main" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>Loading lead details...</div>
        </main>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="logip-layout">
        <Sidebar active="leads" />
        <main className="logip-main">
          <div className="settings-card" style={{ textAlign: "center", padding: 48 }}>
            <h2 style={{ marginBottom: 12 }}>Lead Not Found</h2>
            <button className="btn btn-secondary" onClick={() => router.push("/crm/leads")}>
              Back to Leads
            </button>
          </div>
        </main>
      </div>
    );
  }

  const statusStyle = STATUS_COLORS[lead.status as LeadStatus] || STATUS_COLORS.following;

  return (
    <div className="logip-layout">
      <Sidebar active="leads" />

      <main className="logip-main">
        <div className="logip-header">
          <div className="logip-header-left">
            <button className="logip-back-btn" onClick={() => router.push("/crm/leads")}>
              <HiOutlineArrowLeft size={20} />
            </button>
            <div>
              <h1 className="logip-greeting">{lead.name || "Unnamed Lead"}</h1>
              <p className="logip-subtitle" style={{ direction: "ltr" }}>{lead.phone || "No phone attached"}</p>
            </div>
          </div>
          <div>
            <button className="btn btn-danger" onClick={() => setShowDeleteDialog(true)}>
              <HiOutlineTrash size={16} /> Delete Lead
            </button>
          </div>
        </div>

        <div className="settings-container">
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Overview & Quick Actions</h2>
              <button
                className="leads-status-badge"
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  border: "1px solid var(--border-default)",
                  cursor: "pointer",
                }}
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              >
                <span className="leads-status-dot" style={{ background: statusStyle.dot }} />
                {STATUS_LABELS[lead.status as LeadStatus] || lead.status}
                <HiOutlineChevronDown size={14} />
              </button>
            </div>

            {statusDropdownOpen && (
              <div className="status-picker-dropdown" style={{ marginBottom: 16 }}>
                {LEAD_STATUSES.map((st) => {
                  const s = STATUS_COLORS[st];
                  const isCur = lead.status === st;
                  return (
                    <div
                      key={st}
                      className="status-picker-option"
                      onClick={() => handleStatusChange(st)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="leads-status-dot" style={{ background: s.dot }} />
                        <span>{STATUS_LABELS[st]}</span>
                      </div>
                      {isCur && <HiOutlineCheckCircle size={16} color="var(--primary)" />}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button
                className="btn btn-success"
                style={{ flex: 1 }}
                onClick={() => openWhatsApp(lead.phone, "")}
              >
                <FaWhatsapp size={16} /> WhatsApp Direct
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => window.open("tel:" + formatPhoneForWhatsApp(lead.phone))}
              >
                <HiOutlinePhone size={16} /> Direct Call
              </button>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Lead Details</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="leads-detail-info-row">
                <span className="leads-detail-label">Phone Number</span>
                <span className="leads-detail-value" style={{ direction: "ltr" }}>{lead.phone || "-"}</span>
              </div>
              <div className="leads-detail-info-row">
                <span className="leads-detail-label">Status</span>
                <span className="leads-detail-value">{STATUS_LABELS[lead.status as LeadStatus] || lead.status}</span>
              </div>
              <div className="leads-detail-info-row">
                <span className="leads-detail-label">Created At</span>
                <span className="leads-detail-value">{getTimeAgo(lead.createdAt)}</span>
              </div>
              {lead.updatedAt && (
                <div className="leads-detail-info-row">
                  <span className="leads-detail-label">Last Updated</span>
                  <span className="leads-detail-value">{getTimeAgo(lead.updatedAt)}</span>
                </div>
              )}
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
        confirmLabel="Delete Lead"
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
