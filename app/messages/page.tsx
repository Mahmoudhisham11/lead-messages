"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useDebounce";
import { openWhatsApp } from "@/lib/utils/phone";
import { getTimeAgo } from "@/lib/utils/time";
import {
  subscribeToMessages,
  createMessage,
  updateMessage,
  deleteMessage,
} from "@/services/firebase/messages";
import { subscribeToLeads } from "@/services/firebase/leads";
import { FirestoreDocument } from "@/services/firebase/firestore";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineClipboardDocument,
  HiOutlineClipboardDocumentCheck,
  HiOutlinePaperAirplane,
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { FaWhatsapp, FaCheckDouble } from "react-icons/fa";

function MessagesContent() {
  const { user, canSendMessage, incrementMessageCount } = useAuth();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);

  const [messages, setMessages] = useState<FirestoreDocument[]>([]);
  const [leads, setLeads] = useState<FirestoreDocument[]>([]);

  // Create / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingMsg, setEditingMsg] = useState<FirestoreDocument | null>(null);
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Copied state tracker
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Send to lead modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendMsg, setSendMsg] = useState<FirestoreDocument | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [leadSearch, setLeadSearch] = useState("");

  // Delete message dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [msgToDelete, setMsgToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubMsgs = subscribeToMessages(user.uid, setMessages);
    const unsubLeads = subscribeToLeads(user.uid, setLeads);
    return () => {
      unsubMsgs();
      unsubLeads();
    };
  }, [user]);

  function openCreateModal() {
    setEditingMsg(null);
    setFormContent("");
    setShowModal(true);
  }

  function openEditModal(msg: FirestoreDocument) {
    setEditingMsg(msg);
    setFormContent(msg.content || "");
    setShowModal(true);
  }

  function insertVariable(tag: string) {
    setFormContent((prev) => prev + tag);
  }

  async function handleSave() {
    if (!formContent.trim()) {
      showToast("Please enter a message text", "error");
      return;
    }
    setSaving(true);
    try {
      if (editingMsg) {
        await updateMessage(editingMsg.id, { content: formContent.trim() });
        showToast("Template updated successfully!", "success");
      } else {
        await createMessage(user!.uid, { content: formContent.trim() });
        showToast("New template created!", "success");
      }
      setShowModal(false);
      setFormContent("");
      setEditingMsg(null);
    } catch {
      showToast("Failed to save message template", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!msgToDelete) return;
    setDeleting(true);
    try {
      await deleteMessage(msgToDelete);
      setShowDeleteDialog(false);
      setMsgToDelete(null);
      showToast("Template deleted", "success");
    } catch {
      showToast("Failed to delete template", "error");
    } finally {
      setDeleting(false);
    }
  }

  function handleCopy(msgId: string, content: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(msgId);
    showToast("Copied message to clipboard!", "info");
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleSendToLead() {
    if (!sendMsg || !selectedLeadId) return;
    if (!canSendMessage()) {
      showToast("Daily limit reached. Upgrade to Pro for unlimited messages.", "error");
      return;
    }
    const targetLead = leads.find((l) => l.id === selectedLeadId);
    if (!targetLead) return;

    let text = sendMsg.content || "";
    text = text.replace(/{{name}}/g, targetLead.name || "Client");
    text = text.replace(/{{phone}}/g, targetLead.phone || "");

    openWhatsApp(targetLead.phone, text);
    await incrementMessageCount();
    setShowSendModal(false);
    setSendMsg(null);
    setSelectedLeadId("");
    setLeadSearch("");
    showToast("Opened WhatsApp successfully", "success");
  }

  const filteredMessages = useMemo(() => {
    if (!debouncedSearch.trim()) return messages;
    const q = debouncedSearch.toLowerCase().trim();
    return messages.filter((m) => m.content?.toLowerCase().includes(q));
  }, [messages, debouncedSearch]);

  const filteredLeadsForSend = useMemo(() => {
    if (!leadSearch.trim()) return leads;
    const q = leadSearch.toLowerCase().trim();
    return leads.filter(
      (l) => l.name?.toLowerCase().includes(q) || l.phone?.includes(q)
    );
  }, [leads, leadSearch]);

  const maxChars = 1000;

  return (
    <div className="logip-layout">
      <Sidebar active="messages" />

      <main className="logip-main">
        {/* Header */}
        <div className="logip-header">
          <div className="logip-header-left">
            <div>
              <h1 className="logip-greeting">Message Templates</h1>
              <p className="logip-subtitle">
                Create ready-to-send WhatsApp messages with smart placeholders
              </p>
            </div>
          </div>
          <div>
            <button className="btn btn-primary" onClick={openCreateModal}>
              <HiOutlinePencilSquare size={16} /> New Template
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="leads-filter-container" style={{ marginBottom: 20 }}>
          <div className="leads-search-box">
            <HiOutlineMagnifyingGlass size={18} className="leads-search-icon" />
            <input
              type="text"
              className="leads-search-input"
              placeholder="Search message templates by keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                style={{ position: "absolute", right: 12, color: "var(--text-tertiary)" }}
                onClick={() => setSearchQuery("")}
              >
                <HiOutlineXMark size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Templates Grid */}
        {filteredMessages.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: "var(--radius-lg)", padding: "48px 24px" }}>
            <EmptyState
              icon={HiOutlinePencilSquare}
              title={debouncedSearch ? "No matching templates found" : "No templates yet"}
              description={
                debouncedSearch
                  ? "Try searching for different keywords"
                  : "Create your first WhatsApp message template with placeholders like {{name}}"
              }
              actionLabel={!debouncedSearch ? "Create Template" : undefined}
              onAction={!debouncedSearch ? openCreateModal : undefined}
            />
          </div>
        ) : (
          <div className="msg-cards-grid">
            {filteredMessages.map((msg) => {
              const isCopied = copiedId === msg.id;

              return (
                <div key={msg.id} className="whatsapp-preview-card">
                  {/* WhatsApp Realistic Chat Bubble */}
                  <div className="whatsapp-chat-bg">
                    <div className="whatsapp-bubble">
                      <p>{msg.content}</p>
                      <div className="whatsapp-bubble-time">
                        <span>12:00 PM</span>
                        <FaCheckDouble size={11} color="#53bdeb" />
                      </div>
                    </div>
                  </div>

                  <div className="msg-card-footer">
                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                      {getTimeAgo(msg.createdAt)}
                    </span>

                    <div className="msg-card-actions">
                      <button
                        className="quick-action-btn"
                        onClick={() => handleCopy(msg.id, msg.content || "")}
                        title="Copy message"
                      >
                        {isCopied ? (
                          <HiOutlineClipboardDocumentCheck size={16} color="var(--status-done_deal-text)" />
                        ) : (
                          <HiOutlineClipboardDocument size={16} />
                        )}
                      </button>

                      <button
                        className="quick-action-btn wa"
                        onClick={() => {
                          setSendMsg(msg);
                          setShowSendModal(true);
                        }}
                        title="Send to Lead via WhatsApp"
                      >
                        <FaWhatsapp size={16} color="#25D366" />
                      </button>

                      <button
                        className="quick-action-btn"
                        onClick={() => openEditModal(msg)}
                        title="Edit Template"
                      >
                        <HiOutlinePencilSquare size={16} />
                      </button>

                      <button
                        className="quick-action-btn"
                        onClick={() => {
                          setMsgToDelete(msg.id);
                          setShowDeleteDialog(true);
                        }}
                        title="Delete Template"
                      >
                        <HiOutlineTrash size={16} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create / Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingMsg ? "Edit Message Template" : "New WhatsApp Template"}</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Message Content</label>
                  <textarea
                    className="form-input"
                    rows={5}
                    placeholder="e.g. Hello {{name}}, thank you for contacting us regarding your inquiry..."
                    value={formContent}
                    onChange={(e) => {
                      if (e.target.value.length <= maxChars) setFormContent(e.target.value);
                    }}
                    style={{ resize: "vertical" }}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
                        Insert Variable:
                      </span>
                      <div className="placeholder-pills">
                        <button
                          type="button"
                          className="placeholder-pill"
                          onClick={() => insertVariable("{{name}}")}
                        >
                          <HiOutlineSparkles size={12} /> {"{{name}}"}
                        </button>
                        <button
                          type="button"
                          className="placeholder-pill"
                          onClick={() => insertVariable("{{phone}}")}
                        >
                          <HiOutlineSparkles size={12} /> {"{{phone}}"}
                        </button>
                      </div>
                    </div>

                    <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                      {formContent.length} / {maxChars}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving || !formContent.trim()}
                >
                  {saving ? "Saving..." : editingMsg ? "Update Template" : "Create Template"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send to Lead Modal */}
        {showSendModal && sendMsg && (
          <div className="modal-overlay" onClick={() => { setShowSendModal(false); setSendMsg(null); setSelectedLeadId(""); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FaWhatsapp size={20} color="#25D366" />
                  <h3>Send Template to Lead</h3>
                </div>
                <button className="btn-ghost btn-icon" onClick={() => { setShowSendModal(false); setSendMsg(null); setSelectedLeadId(""); }}>
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: "var(--radius-md)", marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                    Template Preview:
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-primary)" }}>{sendMsg.content}</p>
                </div>

                <div className="form-group">
                  <label>Select Target Lead</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search lead by name or phone..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    style={{ marginBottom: 10 }}
                  />

                  {filteredLeadsForSend.length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", padding: 8 }}>
                      No leads found. Create a lead first.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                      {filteredLeadsForSend.map((l) => {
                        const isSelected = selectedLeadId === l.id;
                        return (
                          <div
                            key={l.id}
                            onClick={() => setSelectedLeadId(l.id)}
                            style={{
                              padding: "10px 12px",
                              borderRadius: "var(--radius-md)",
                              border: `1px solid ${isSelected ? "var(--primary)" : "var(--border-default)"}`,
                              background: isSelected ? "#f0f9ff" : "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{l.name || "Unnamed"}</div>
                              <div style={{ fontSize: 11, color: "var(--text-secondary)", direction: "ltr" }}>
                                {l.phone}
                              </div>
                            </div>
                            {isSelected && <HiOutlinePaperAirplane size={16} color="var(--primary)" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setShowSendModal(false); setSendMsg(null); setSelectedLeadId(""); }}>
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleSendToLead}
                  disabled={!selectedLeadId}
                >
                  <FaWhatsapp size={15} /> Send via WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Delete Message Template"
          message="Are you sure you want to delete this template? This cannot be undone."
          confirmLabel="Delete"
          loading={deleting}
        />
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <AuthGuard>
      <MessagesContent />
    </AuthGuard>
  );
}
