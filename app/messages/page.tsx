"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
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
import SearchBar from "@/components/ui/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import Alert from "@/components/ui/Alert";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";

function MessagesContent() {
  const { user, canSendMessage, incrementMessageCount } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [messages, setMessages] = useState<FirestoreDocument[]>([]);
  const [leads, setLeads] = useState<FirestoreDocument[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMsg, setEditingMsg] = useState<FirestoreDocument | null>(null);

  // Form state
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [msgToDelete, setMsgToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Send to lead
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendMsg, setSendMsg] = useState<FirestoreDocument | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsubMsgs = subscribeToMessages(user.uid, setMessages);
    const unsubLeads = subscribeToLeads(user.uid, setLeads);
    return () => { unsubMsgs(); unsubLeads(); };
  }, [user]);

  function openCreateModal() {
    setEditingMsg(null);
    setFormContent("");
    setShowCreateModal(true);
  }

  function openEditModal(msg: FirestoreDocument) {
    setEditingMsg(msg);
    setFormContent(msg.content || "");
    setShowCreateModal(true);
  }

  function resetForm() {
    setFormContent("");
    setEditingMsg(null);
  }

  async function handleSave() {
    if (!formContent.trim()) {
      setError("Please enter a message");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingMsg) {
        await updateMessage(editingMsg.id, { content: formContent.trim() });
        setSuccess("Message updated");
      } else {
        await createMessage(user!.uid, { content: formContent.trim() });
        setSuccess("Message created");
      }

      setShowCreateModal(false);
      resetForm();
    } catch {
      setError("Failed to save message");
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
      setSuccess("Message deleted");
    } catch {
      setError("Failed to delete message");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSendToLead() {
    if (!sendMsg || !selectedLeadId) return;
    if (!canSendMessage()) {
      setError("Daily limit reached. Upgrade to Pro for unlimited messages.");
      return;
    }
    const lead = leads.find((l) => l.id === selectedLeadId);
    if (!lead) return;
    openWhatsApp(lead.phone, sendMsg.content || "");
    await incrementMessageCount();
    setShowSendModal(false);
    setSendMsg(null);
    setSelectedLeadId("");
  }

  const filteredMessages = messages.filter((msg) => {
    if (!debouncedSearch) return true;
    const query = debouncedSearch.toLowerCase();
    return msg.content?.toLowerCase().includes(query);
  });

  const charCount = formContent.length;
  const maxChars = 1000;

  return (
    <div className="logip-layout">
      <Sidebar active="messages" />

      <main className="logip-main">
        <div className="logip-header">
          <div className="logip-header-left">
            <h1 className="logip-greeting">Messages</h1>
            <p className="logip-subtitle">{filteredMessages.length} messages</p>
          </div>
          <div className="logip-header-right">
            <button className="btn btn-primary" onClick={openCreateModal}>
              <HiOutlinePencilSquare size={16} /> New Message
            </button>
          </div>
        </div>

        {success && <Alert variant="success" message={success} onDismiss={() => setSuccess("")} autoDismiss />}
        {error && <Alert variant="error" message={error} onDismiss={() => setError("")} />}

        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search messages..." />

        {filteredMessages.length === 0 ? (
          <EmptyState
            icon={HiOutlinePencilSquare}
            title={debouncedSearch ? "No messages found" : "No messages yet"}
            description="Create a message template to quickly send to your leads"
          />
        ) : (
          <div className="msg-cards-grid">
            {filteredMessages.map((msg) => (
              <div key={msg.id} className="msg-card">
                <div className="msg-card-body">
                  <p className="msg-card-text">{msg.content}</p>
                </div>
                <div className="msg-card-footer">
                  <span className="msg-card-time">{getTimeAgo(msg.createdAt)}</span>
                  <div className="msg-card-actions">
                    <button
                      className="msg-card-action"
                      onClick={() => {
                        setSendMsg(msg);
                        setShowSendModal(true);
                      }}
                      title="Send to Lead"
                    >
                      <HiOutlinePaperAirplane size={14} />
                    </button>
                    <button
                      className="msg-card-action"
                      onClick={() => openEditModal(msg)}
                      title="Edit"
                    >
                      <HiOutlinePencilSquare size={14} />
                    </button>
                    <button
                      className="msg-card-action danger"
                      onClick={() => { setMsgToDelete(msg.id); setShowDeleteDialog(true); }}
                      title="Delete"
                    >
                      <HiOutlineTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="leads-modal-overlay" onClick={() => { setShowCreateModal(false); resetForm(); }}>
          <div className="leads-modal" onClick={(e) => e.stopPropagation()}>
            <div className="leads-modal-header">
              <h2>{editingMsg ? "Edit Message" : "New Message"}</h2>
              <button className="leads-modal-close" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                <HiOutlineXMark size={20} />
              </button>
            </div>
            <div className="leads-modal-body">
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={formContent}
                  onChange={(e) => { if (e.target.value.length <= maxChars) setFormContent(e.target.value); }}
                  placeholder="Type your message..."
                  rows={4}
                  className="form-input"
                  style={{ resize: "vertical" }}
                />
                <span className="char-count" style={{ color: charCount > maxChars * 0.9 ? "var(--red)" : undefined }}>
                  {charCount} / {maxChars}
                </span>
              </div>
            </div>
            <div className="leads-modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !formContent.trim()}>
                {saving ? "Saving..." : editingMsg ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSendModal && sendMsg && (
        <div className="leads-modal-overlay" onClick={() => { setShowSendModal(false); setSendMsg(null); setSelectedLeadId(""); }}>
          <div className="leads-modal" onClick={(e) => e.stopPropagation()}>
            <div className="leads-modal-header">
              <h2>Send to Lead</h2>
              <button className="leads-modal-close" onClick={() => { setShowSendModal(false); setSendMsg(null); setSelectedLeadId(""); }}>
                <HiOutlineXMark size={20} />
              </button>
            </div>
            <div className="leads-modal-body">
              <div className="msg-send-preview">
                <p className="msg-send-preview-text">{sendMsg.content?.substring(0, 100)}{sendMsg.content?.length > 100 ? "..." : ""}</p>
              </div>

              <div className="form-group">
                <label>Select Lead</label>
                {leads.length === 0 ? (
                  <p className="leads-empty-msg">No leads available. Create a lead first.</p>
                ) : (
                  <div className="leads-msg-list">
                    {leads.map((lead) => (
                      <button
                        key={lead.id}
                        className={`leads-msg-option ${selectedLeadId === lead.id ? "selected" : ""}`}
                        onClick={() => setSelectedLeadId(lead.id)}
                      >
                        <div className="leads-msg-option-content">
                          <span className="leads-msg-option-name">{lead.name || "Unnamed"}</span>
                          <span className="leads-msg-option-phone">{lead.phone}</span>
                        </div>
                        {selectedLeadId === lead.id && <HiOutlineCheckCircle size={18} className="leads-msg-option-check" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="leads-modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowSendModal(false); setSendMsg(null); setSelectedLeadId(""); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSendToLead} disabled={!selectedLeadId}>
                <HiOutlinePaperAirplane size={16} /> Send via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message?"
        confirmLabel="Delete"
        loading={deleting}
      />
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
