"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  subscribeToLeads,
  createLead,
  deleteLead,
  updateLead,
  LEAD_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  type LeadStatus,
} from "@/services/firebase/leads";
import { subscribeToMessages } from "@/services/firebase/messages";
import { openWhatsApp } from "@/lib/utils/phone";
import { getTimeAgo } from "@/lib/utils/time";
import { FirestoreDocument } from "@/services/firebase/firestore";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import Alert from "@/components/ui/Alert";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CountryCodeSelect from "@/components/ui/CountryCodeSelect";
import {
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlinePhone,
  HiOutlineChatBubbleLeft,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineArrowUpRight,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";

const TAB_STATUSES = ["urgent", "following", "showing", "meeting", "not_interested", "unreachable", "done_deal", "canceled", "seller", "buyer", "postponed"] as const;

function LeadsContent() {
  const { user, canSendMessage, incrementMessageCount } = useAuth();
  const [leads, setLeads] = useState<FirestoreDocument[]>([]);
  const [messages, setMessages] = useState<FirestoreDocument[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCountryCode, setNewCountryCode] = useState("+20");
  const [newPhone, setNewPhone] = useState("");
  const [newStatus, setNewStatus] = useState<LeadStatus>("following");
  const [creating, setCreating] = useState(false);

  // Detail sidebar
  const [selectedLead, setSelectedLead] = useState<FirestoreDocument | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);

  // Tabs auto-scroll
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollToTab = useCallback(() => {
    const container = tabsRef.current;
    if (!container) return;
    const active = container.querySelector(".leads-tab.active") as HTMLElement | null;
    if (active) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      if (activeRect.left < containerRect.left || activeRect.right > containerRect.right) {
        active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, []);

  useEffect(() => {
    scrollToTab();
  }, [activeTab, scrollToTab]);

  // Send message modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendToLead, setSendToLead] = useState<FirestoreDocument | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState("");

  // Delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsubLeads = subscribeToLeads(user.uid, setLeads);
    const unsubMessages = subscribeToMessages(user.uid, setMessages);
    return () => { unsubLeads(); unsubMessages(); };
  }, [user]);

  // Tab counts
  const tabCounts: Record<string, number> = { all: leads.length };
  TAB_STATUSES.forEach((s) => {
    tabCounts[s] = leads.filter((l) => l.status === s).length;
  });

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    if (activeTab === "all") return true;
    return lead.status === activeTab;
  });

  function handleSelectAll() {
    if (selectAll) { setSelectedIds([]); } else { setSelectedIds(filteredLeads.map((l) => l.id)); }
    setSelectAll(!selectAll);
  }

  function handleSelect(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  }

  async function handleCreate() {
    if (!newName.trim() && !newPhone.trim()) { setError("Please enter a name or phone number"); return; }
    setCreating(true);
    setError("");
    try {
      const fullPhone = newPhone.trim() ? newCountryCode + newPhone.trim() : "";
      await createLead(user!.uid, {
        name: newName.trim(),
        phone: fullPhone,
        status: newStatus,
      });
      setShowCreateModal(false);
      resetForm();
      setSuccess("Lead created successfully");
    } catch {
      setError("Failed to create lead");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!leadToDelete) return;
    setDeleting(true);
    try {
      await deleteLead(leadToDelete);
      setShowDeleteDialog(false);
      setLeadToDelete(null);
      if (selectedLead?.id === leadToDelete) { setSelectedLead(null); setShowSidebar(false); }
      setSuccess("Lead deleted");
    } catch {
      setError("Failed to delete lead");
    } finally {
      setDeleting(false);
    }
  }

  async function handleStatusChange(newStatus: LeadStatus) {
    if (!selectedLead) return;
    try {
      await updateLead(selectedLead.id, { status: newStatus });
      setSelectedLead({ ...selectedLead, status: newStatus });
      setEditingStatus(false);
      setSuccess("Status updated");
    } catch {
      setError("Failed to update status");
    }
  }

  async function handleSendMessage() {
    if (!sendToLead || !selectedMessageId) return;
    if (!canSendMessage()) {
      setError("Daily limit reached. Upgrade to Pro for unlimited messages.");
      return;
    }
    const msg = messages.find((m) => m.id === selectedMessageId);
    if (!msg) return;
    openWhatsApp(sendToLead.phone, msg.content || "");
    await incrementMessageCount();
    setShowSendModal(false);
    setSendToLead(null);
    setSelectedMessageId("");
  }

  function openSidebar(lead: FirestoreDocument) {
    setSelectedLead(lead);
    setShowSidebar(true);
    setEditingStatus(false);
  }

  function closeSidebar() {
    setShowSidebar(false);
    setTimeout(() => setSelectedLead(null), 400);
  }

  function resetForm() {
    setNewName("");
    setNewCountryCode("+20");
    setNewPhone("");
    setNewStatus("following");
  }

  return (
    <div className="logip-layout">
      <Sidebar active="leads" />

      <main className="logip-main" style={{ position: "relative" }}>
        <div className="logip-header">
          <div className="logip-header-left">
            <h1 className="logip-greeting">Leads</h1>
            <p className="logip-subtitle">{filteredLeads.length} leads</p>
          </div>
        </div>

        {success && <Alert variant="success" message={success} onDismiss={() => setSuccess("")} autoDismiss />}
        {error && <Alert variant="error" message={error} onDismiss={() => setError("")} />}

        {/* Tabs */}
        <div className="leads-tabs" ref={tabsRef}>
          <button
            className={`leads-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
            <span className="leads-tab-count">{tabCounts.all}</span>
          </button>
          {TAB_STATUSES.map((s) => (
            <button
              key={s}
              className={`leads-tab ${activeTab === s ? "active" : ""}`}
              onClick={() => setActiveTab(s)}
            >
              {STATUS_LABELS[s]}
              <span className="leads-tab-count">{tabCounts[s] || 0}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="leads-table-wrap">
          <table className="leads-table">
            <thead>
              <tr>
                <th className="leads-th-check">
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                </th>
                <th>Name</th>
                <th>Phone</th>
                <th>Stats</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="leads-empty">
                    No leads found
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const statusStyle = STATUS_COLORS[lead.status as LeadStatus] || STATUS_COLORS.following;
                  return (
                    <tr
                      key={lead.id}
                      className={`leads-row ${selectedLead?.id === lead.id ? "selected" : ""}`}
                      onClick={() => openSidebar(lead)}
                    >
                      <td className="leads-td-check" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(lead.id)}
                          onChange={() => handleSelect(lead.id)}
                        />
                      </td>
                      <td className="leads-td-name">
                        <div className="leads-name-cell">
                          <div className="leads-name-avatar" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {(lead.name || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="leads-name-text">{lead.name || "Unnamed Lead"}</span>
                        </div>
                      </td>
                      <td className="leads-td-phone">{lead.phone || "-"}</td>
                      <td className="leads-td-status" onClick={(e) => e.stopPropagation()}>
                        <span className="leads-status-badge" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          <span className="leads-status-dot" style={{ background: statusStyle.dot }} />
                          {STATUS_LABELS[lead.status as LeadStatus] || lead.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Floating Add Button */}
        <button className="leads-add-btn" onClick={() => setShowCreateModal(true)}>
          <HiOutlinePlus size={24} />
        </button>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="leads-modal-overlay" onClick={() => { setShowCreateModal(false); resetForm(); }}>
            <div className="leads-modal" onClick={(e) => e.stopPropagation()}>
              <div className="leads-modal-header">
                <h2>New Lead</h2>
                <button className="leads-modal-close" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                  <HiOutlineXMark size={20} />
                </button>
              </div>
              <div className="leads-modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Lead name"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="phone-input-group">
                    <CountryCodeSelect value={newCountryCode} onChange={setNewCountryCode} />
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="123 456 7890"
                      className="form-input"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as LeadStatus)} className="form-input">
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="leads-modal-footer">
                <button className="btn btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                  {creating ? "Creating..." : "Create Lead"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Sidebar */}
        {selectedLead && (
          <div className={`leads-detail-sidebar ${showSidebar ? "open" : ""}`}>
            <div className="leads-detail-header">
              <button className="leads-detail-close" onClick={closeSidebar}>
                <HiOutlineXMark size={20} />
              </button>
            </div>

            <div className="leads-detail-avatar-section">
              <div className="leads-detail-avatar">
                <span>{(selectedLead.name || "?").slice(0, 2).toUpperCase()}</span>
              </div>
              <h3 className="leads-detail-name">{selectedLead.name || "Unnamed Lead"}</h3>
              <p className="leads-detail-phone">{selectedLead.phone || "No phone"}</p>
            </div>

            <div className="leads-detail-actions">
              <button
                className="leads-detail-action-btn"
                onClick={() => {
                  if (selectedLead.phone) {
                    window.open(`tel:${selectedLead.phone}`, "_self");
                  }
                }}
              >
                <HiOutlinePhone size={18} />
                <span>Call</span>
              </button>
              <button
                className="leads-detail-action-btn"
                onClick={() => {
                  setSendToLead(selectedLead);
                  setShowSendModal(true);
                }}
              >
                <HiOutlineChatBubbleLeft size={18} />
                <span>Message</span>
              </button>
              <button
                className="leads-detail-action-btn"
                onClick={() => {
                  setLeadToDelete(selectedLead.id);
                  setShowDeleteDialog(true);
                }}
              >
                <HiOutlineTrash size={18} />
                <span>Delete</span>
              </button>
            </div>

            <div className="leads-detail-info">
              <div className="leads-detail-info-row">
                <span className="leads-detail-label">Status</span>
                <span className="leads-detail-value">
                  <span
                    className="leads-status-badge"
                    style={{
                      background: STATUS_COLORS[selectedLead.status as LeadStatus]?.bg || STATUS_COLORS.following.bg,
                      color: STATUS_COLORS[selectedLead.status as LeadStatus]?.color || STATUS_COLORS.following.color,
                      cursor: "pointer",
                    }}
                    onClick={() => setEditingStatus(!editingStatus)}
                  >
                    <span
                      className="leads-status-dot"
                      style={{ background: STATUS_COLORS[selectedLead.status as LeadStatus]?.dot || STATUS_COLORS.following.dot }}
                    />
                    {STATUS_LABELS[selectedLead.status as LeadStatus] || selectedLead.status}
                  </span>
                </span>
              </div>

              {editingStatus && (
                <div className="leads-status-grid">
                  {LEAD_STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`btn ${selectedLead.status === s ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => handleStatusChange(s)}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}

              <div className="leads-detail-info-row">
                <span className="leads-detail-label">Created</span>
                <span className="leads-detail-value">{getTimeAgo(selectedLead.createdAt)}</span>
              </div>
              {selectedLead.updatedAt && (
                <div className="leads-detail-info-row">
                  <span className="leads-detail-label">Last Edited</span>
                  <span className="leads-detail-value">{getTimeAgo(selectedLead.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sidebar backdrop */}
        {showSidebar && <div className="leads-detail-backdrop" onClick={closeSidebar} />}

        {/* Send Message Modal */}
        {showSendModal && sendToLead && (
          <div className="leads-modal-overlay" onClick={() => { setShowSendModal(false); setSendToLead(null); setSelectedMessageId(""); }}>
            <div className="leads-modal" onClick={(e) => e.stopPropagation()}>
              <div className="leads-modal-header">
                <h2>Send Message to {sendToLead.name || "Lead"}</h2>
                <button className="leads-modal-close" onClick={() => { setShowSendModal(false); setSendToLead(null); setSelectedMessageId(""); }}>
                  <HiOutlineXMark size={20} />
                </button>
              </div>
              <div className="leads-modal-body">
                {messages.length === 0 ? (
                  <div className="leads-empty-msg">
                    <p>No saved messages yet.</p>
                    <p>Create a message in the Messages page first.</p>
                  </div>
                ) : (
                  <div className="leads-msg-list">
                    {messages.map((msg) => (
                      <button
                        key={msg.id}
                        className={`leads-msg-option ${selectedMessageId === msg.id ? "selected" : ""}`}
                        onClick={() => setSelectedMessageId(msg.id)}
                      >
                        <div className="leads-msg-option-content">
                          <p className="leads-msg-option-text">{msg.content?.substring(0, 80)}{msg.content?.length > 80 ? "..." : ""}</p>
                          <span className="leads-msg-option-name">{msg.content?.substring(0, 50) || "No content"}</span>
                        </div>
                        {selectedMessageId === msg.id && <HiOutlineCheckCircle size={18} className="leads-msg-option-check" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="leads-modal-footer">
                <button className="btn btn-secondary" onClick={() => { setShowSendModal(false); setSendToLead(null); setSelectedMessageId(""); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSendMessage} disabled={!selectedMessageId}>
                  <HiOutlinePaperAirplane size={16} /> Send via WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
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

export default function LeadsPage() {
  return (
    <AuthGuard>
      <LeadsContent />
    </AuthGuard>
  );
}
