"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import {
  subscribeToLeads,
  createLead,
  deleteLead,
  updateLead,
  bulkDeleteLeads,
  bulkUpdateLeads,
  LEAD_STATUSES,
  STATUS_LABELS,
  STATUS_COLORS,
  type LeadStatus,
} from "@/services/firebase/leads";
import { subscribeToMessages } from "@/services/firebase/messages";
import { openWhatsApp } from "@/lib/utils/phone";
import { getTimeAgo } from "@/lib/utils/time";
import { exportLeadsToCSV } from "@/lib/utils/csv";
import { FirestoreDocument } from "@/services/firebase/firestore";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CountryCodeSelect from "@/components/ui/CountryCodeSelect";
import EmptyState from "@/components/ui/EmptyState";
import ImportExcelModal from "@/components/crm/ImportExcelModal";
import {
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlinePhone,
  HiOutlineChatBubbleLeft,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowDownTray,
  HiOutlineUserGroup,
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCheckBadge,
  HiOutlineChevronDown,
  HiOutlinePaperAirplane,
} from "react-icons/hi2";
import { FaWhatsapp, FaFileExcel } from "react-icons/fa";

const TAB_STATUSES = [
  "urgent",
  "following",
  "showing",
  "meeting",
  "not_interested",
  "unreachable",
  "done_deal",
  "canceled",
  "seller",
  "buyer",
  "postponed",
] as const;

function LeadsContent() {
  const { user, canSendMessage, incrementMessageCount } = useAuth();
  const { showToast } = useToast();

  const [leads, setLeads] = useState<FirestoreDocument[]>([]);
  const [messages, setMessages] = useState<FirestoreDocument[]>([]);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<LeadStatus>("following");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Import Excel Modal
  const [showImportModal, setShowImportModal] = useState(false);

  // Create Lead Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCountryCode, setNewCountryCode] = useState("+20");
  const [newPhone, setNewPhone] = useState("");
  const [newStatus, setNewStatus] = useState<LeadStatus>("following");
  const [creating, setCreating] = useState(false);

  // Detail Drawer
  const [selectedLead, setSelectedLead] = useState<FirestoreDocument | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Send WhatsApp Modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendToLead, setSendToLead] = useState<FirestoreDocument | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState("");

  // Single Delete Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Auto-scroll tabs
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const unsubLeads = subscribeToLeads(user.uid, setLeads);
    const unsubMessages = subscribeToMessages(user.uid, setMessages);
    return () => {
      unsubLeads();
      unsubMessages();
    };
  }, [user]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: leads.length };
    TAB_STATUSES.forEach((s) => {
      counts[s] = leads.filter((l) => l.status === s).length;
    });
    return counts;
  }, [leads]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const total = leads.length;
    const urgent = leads.filter((l) => l.status === "urgent").length;
    const following = leads.filter((l) => l.status === "following").length;
    const doneDeal = leads.filter((l) => l.status === "done_deal").length;
    return { total, urgent, following, doneDeal };
  }, [leads]);

  // Filtered & Sorted Leads
  const filteredLeads = useMemo(() => {
    let result = leads.filter((lead) => {
      // Tab filter
      if (activeTab !== "all" && lead.status !== activeTab) return false;
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = lead.name?.toLowerCase().includes(q);
        const matchesPhone = lead.phone?.includes(q);
        if (!matchesName && !matchesPhone) return false;
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name") {
        return (a.name || "").localeCompare(b.name || "");
      }
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
      if (sortBy === "oldest") {
        return timeA - timeB;
      }
      return timeB - timeA;
    });

    return result;
  }, [leads, activeTab, searchQuery, sortBy]);

  // Select all handler
  const allFilteredSelected = filteredLeads.length > 0 && filteredLeads.every((l) => selectedIds.includes(l.id));

  function handleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  // Create Lead
  async function handleCreate() {
    if (!newName.trim() && !newPhone.trim()) {
      showToast("Please enter a name or phone number", "error");
      return;
    }
    setCreating(true);
    try {
      const fullPhone = newPhone.trim() ? newCountryCode + newPhone.trim() : "";
      await createLead(user!.uid, {
        name: newName.trim(),
        phone: fullPhone,
        status: newStatus,
      });
      setShowCreateModal(false);
      resetCreateForm();
      showToast("Lead added successfully!", "success");
    } catch {
      showToast("Failed to create lead", "error");
    } finally {
      setCreating(false);
    }
  }

  function resetCreateForm() {
    setNewName("");
    setNewCountryCode("+20");
    setNewPhone("");
    setNewStatus("following");
  }

  // Single Delete
  async function handleDelete() {
    if (!leadToDelete) return;
    setDeleting(true);
    try {
      await deleteLead(leadToDelete);
      setShowDeleteDialog(false);
      if (selectedLead?.id === leadToDelete) {
        setShowDrawer(false);
        setSelectedLead(null);
      }
      setSelectedIds((prev) => prev.filter((id) => id !== leadToDelete));
      setLeadToDelete(null);
      showToast("Lead deleted successfully", "success");
    } catch {
      showToast("Failed to delete lead", "error");
    } finally {
      setDeleting(false);
    }
  }

  // Bulk Delete
  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    try {
      await bulkDeleteLeads(selectedIds);
      showToast(`Deleted ${selectedIds.length} leads`, "success");
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
    } catch {
      showToast("Failed to delete selected leads", "error");
    } finally {
      setBulkDeleting(false);
    }
  }

  // Bulk Status Update
  async function handleBulkStatusChange() {
    if (selectedIds.length === 0) return;
    try {
      const updates = selectedIds.map((id) => ({
        id,
        data: { status: bulkTargetStatus, updatedAt: new Date() },
      }));
      await bulkUpdateLeads(updates);
      showToast(`Updated status for ${selectedIds.length} leads`, "success");
      setShowBulkStatusModal(false);
      setSelectedIds([]);
    } catch {
      showToast("Failed to update status", "error");
    }
  }

  // Single Status Change
  async function handleStatusChange(leadId: string, newStatus: LeadStatus) {
    try {
      await updateLead(leadId, { status: newStatus });
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
      setStatusDropdownOpen(false);
      showToast(`Status updated to ${STATUS_LABELS[newStatus]}`, "success");
    } catch {
      showToast("Failed to update status", "error");
    }
  }

  // Send WhatsApp message
  async function handleSendMessage() {
    if (!sendToLead || !selectedMessageId) return;
    if (!canSendMessage()) {
      showToast("Daily limit reached. Upgrade to Pro for unlimited messages.", "error");
      return;
    }
    const msg = messages.find((m) => m.id === selectedMessageId);
    if (!msg) return;

    let text = msg.content || "";
    text = text.replace(/{{name}}/g, sendToLead.name || "Client");
    text = text.replace(/{{phone}}/g, sendToLead.phone || "");

    openWhatsApp(sendToLead.phone, text);
    await incrementMessageCount();
    setShowSendModal(false);
    setSendToLead(null);
    setSelectedMessageId("");
    showToast("Opened WhatsApp successfully", "success");
  }

  // Drawer handlers
  function openLeadDrawer(lead: FirestoreDocument) {
    setSelectedLead(lead);
    setShowDrawer(true);
    setStatusDropdownOpen(false);
  }

  function closeLeadDrawer() {
    setShowDrawer(false);
    setTimeout(() => setSelectedLead(null), 300);
  }

  return (
    <div className="logip-layout">
      <Sidebar active="leads" />

      <main className="logip-main">
        {/* Header */}
        <div className="logip-header">
          <div className="logip-header-left">
            <div>
              <h1 className="logip-greeting">Leads Management</h1>
              <p className="logip-subtitle">Track, organize, and communicate with your prospects seamlessly</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowImportModal(true)}
              title="Import leads from Excel or CSV sheet"
            >
              <FaFileExcel size={15} color="#16a34a" /> Import Excel
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => exportLeadsToCSV(leads)}
              title="Export all leads as CSV"
            >
              <HiOutlineArrowDownTray size={16} /> Export CSV
            </button>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <HiOutlinePlus size={16} /> Add Lead
            </button>
          </div>
        </div>

        {/* KPI Metrics Summary */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-wrap" style={{ background: "#f1f5f9", color: "#0f172a" }}>
              <HiOutlineUserGroup size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Total Leads</span>
              <span className="metric-value">{metrics.total}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrap" style={{ background: "var(--status-urgent-bg)", color: "var(--status-urgent-text)" }}>
              <HiOutlineExclamationCircle size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Urgent</span>
              <span className="metric-value">{metrics.urgent}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrap" style={{ background: "var(--status-following-bg)", color: "var(--status-following-text)" }}>
              <HiOutlineClock size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Following Up</span>
              <span className="metric-value">{metrics.following}</span>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrap" style={{ background: "var(--status-done_deal-bg)", color: "var(--status-done_deal-text)" }}>
              <HiOutlineCheckBadge size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Done Deals</span>
              <span className="metric-value">{metrics.doneDeal}</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Box */}
        <div className="leads-filter-container">
          <div className="leads-search-row">
            <div className="leads-search-box">
              <HiOutlineMagnifyingGlass size={18} className="leads-search-icon" />
              <input
                type="text"
                className="leads-search-input"
                placeholder="Search leads by name or phone..."
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

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <select
                className="leads-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="leads-tabs" ref={tabsRef}>
            <button
              className={`leads-tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Leads
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
        </div>

        {/* Desktop Table View */}
        <div className="leads-table-wrap">
          <table className="leads-table">
            <thead>
              <tr>
                <th className="leads-th-check">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th>Lead Info</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Added</th>
                <th style={{ textAlign: "right" }}>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center" }}>
                    <EmptyState
                      icon={HiOutlineUserGroup}
                      title={searchQuery ? "No matching leads found" : "No leads in this category"}
                      description={
                        searchQuery
                          ? "Try checking your spelling or clear the search filter"
                          : "Add your first lead now to start tracking and messaging"
                      }
                      actionLabel={!searchQuery ? "Add New Lead" : undefined}
                      onAction={!searchQuery ? () => setShowCreateModal(true) : undefined}
                    />
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const statusStyle = STATUS_COLORS[lead.status as LeadStatus] || STATUS_COLORS.following;
                  const isSelected = selectedIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      className={`leads-row ${isSelected ? "selected" : ""}`}
                      onClick={() => openLeadDrawer(lead)}
                    >
                      <td className="leads-td-check" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(lead.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>

                      <td>
                        <div className="leads-name-cell">
                          <div
                            className="leads-name-avatar"
                            style={{ background: statusStyle.bg, color: statusStyle.color }}
                          >
                            {(lead.name || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="leads-name-text">{lead.name || "Unnamed Lead"}</span>
                        </div>
                      </td>

                      <td style={{ color: "var(--text-secondary)", direction: "ltr" }}>
                        {lead.phone || "-"}
                      </td>

                      <td onClick={(e) => e.stopPropagation()}>
                        <span
                          className="leads-status-badge"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}
                        >
                          <span className="leads-status-dot" style={{ background: statusStyle.dot }} />
                          {STATUS_LABELS[lead.status as LeadStatus] || lead.status}
                        </span>
                      </td>

                      <td style={{ color: "var(--text-tertiary)", fontSize: 12 }}>
                        {getTimeAgo(lead.createdAt)}
                      </td>

                      <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div className="leads-quick-actions" style={{ justifyContent: "flex-end" }}>
                          {lead.phone && (
                            <>
                              <button
                                className="quick-action-btn wa"
                                title="Send WhatsApp Message"
                                onClick={() => {
                                  setSendToLead(lead);
                                  setShowSendModal(true);
                                }}
                              >
                                <FaWhatsapp size={15} />
                              </button>
                              <button
                                className="quick-action-btn"
                                title="Direct Phone Call"
                                onClick={() => window.open(`tel:${lead.phone}`, "_self")}
                              >
                                <HiOutlinePhone size={15} />
                              </button>
                            </>
                          )}
                          <button
                            className="quick-action-btn"
                            title="Delete Lead"
                            onClick={() => {
                              setLeadToDelete(lead.id);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <HiOutlineTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="leads-mobile-list">
          {filteredLeads.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: "var(--radius-lg)", padding: "32px 16px" }}>
              <EmptyState
                icon={HiOutlineUserGroup}
                title={searchQuery ? "No matching leads found" : "No leads yet"}
                description="Add your first lead now to start tracking"
                actionLabel="Add Lead"
                onAction={() => setShowCreateModal(true)}
              />
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const statusStyle = STATUS_COLORS[lead.status as LeadStatus] || STATUS_COLORS.following;
              const isSelected = selectedIds.includes(lead.id);

              return (
                <div
                  key={lead.id}
                  className="lead-mobile-card"
                  onClick={() => openLeadDrawer(lead)}
                  style={{
                    borderLeft: `4px solid ${statusStyle.dot}`,
                    background: isSelected ? "#f0f9ff" : "#fff",
                  }}
                >
                  <div className="lead-mobile-header">
                    <div className="lead-mobile-user">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(lead.id);
                        }}
                        style={{ width: 16, height: 16 }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.name || "Unnamed"}</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", direction: "ltr" }}>
                          {lead.phone || "No phone"}
                        </div>
                      </div>
                    </div>

                    <span
                      className="leads-status-badge"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                      <span className="leads-status-dot" style={{ background: statusStyle.dot }} />
                      {STATUS_LABELS[lead.status as LeadStatus] || lead.status}
                    </span>
                  </div>

                  <div className="lead-mobile-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setSendToLead(lead);
                        setShowSendModal(true);
                      }}
                    >
                      <FaWhatsapp size={14} color="#25D366" /> WhatsApp
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => window.open(`tel:${lead.phone}`, "_self")}
                    >
                      <HiOutlinePhone size={14} /> Call
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Floating Add Lead FAB */}
        <button className="leads-add-btn" onClick={() => setShowCreateModal(true)} title="Add New Lead">
          <HiOutlinePlus size={24} />
        </button>

        {/* Floating Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bulk-actions-bar">
            <span className="bulk-selected-count">{selectedIds.length} Selected</span>
            <div className="bulk-actions-buttons">
              <button className="bulk-btn" onClick={() => setShowBulkStatusModal(true)}>
                Change Status
              </button>
              <button
                className="bulk-btn"
                onClick={() => {
                  const selectedLeads = leads.filter((l) => selectedIds.includes(l.id));
                  exportLeadsToCSV(selectedLeads);
                }}
              >
                <HiOutlineArrowDownTray size={14} /> Export CSV
              </button>
              <button
                className="bulk-btn danger"
                onClick={() => setShowBulkDeleteConfirm(true)}
              >
                <HiOutlineTrash size={14} /> Delete
              </button>
              <button
                className="btn-ghost btn-icon"
                style={{ color: "#94a3b8" }}
                onClick={() => setSelectedIds([])}
                title="Deselect All"
              >
                <HiOutlineXMark size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Slide-over Detail Drawer */}
        {selectedLead && (
          <>
            <div className="leads-detail-backdrop" onClick={closeLeadDrawer} />
            <div className={`leads-detail-sidebar ${showDrawer ? "open" : ""}`}>
              <div className="leads-detail-header">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)" }}>
                  LEAD PROFILE
                </span>
                <button className="btn-ghost btn-icon" onClick={closeLeadDrawer}>
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              <div className="leads-detail-avatar-section">
                <div className="leads-detail-avatar">
                  {(selectedLead.name || "?").slice(0, 2).toUpperCase()}
                </div>
                <h3 className="leads-detail-name">{selectedLead.name || "Unnamed Lead"}</h3>
                <p className="leads-detail-phone">{selectedLead.phone || "No phone attached"}</p>
              </div>

              <div className="leads-detail-actions">
                <button
                  className="leads-detail-action-btn"
                  onClick={() => {
                    if (selectedLead.phone) window.open(`tel:${selectedLead.phone}`, "_self");
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
                  <FaWhatsapp size={18} color="#25D366" />
                  <span>WhatsApp</span>
                </button>
                <button
                  className="leads-detail-action-btn"
                  onClick={() => {
                    setLeadToDelete(selectedLead.id);
                    setShowDeleteDialog(true);
                  }}
                >
                  <HiOutlineTrash size={18} color="#ef4444" />
                  <span>Delete</span>
                </button>
              </div>

              <div className="leads-detail-info">
                {/* Status Picker with Dropdown */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="leads-detail-label">Current Status</span>
                    <button
                      className="leads-status-badge"
                      style={{
                        background: STATUS_COLORS[selectedLead.status as LeadStatus]?.bg || STATUS_COLORS.following.bg,
                        color: STATUS_COLORS[selectedLead.status as LeadStatus]?.color || STATUS_COLORS.following.color,
                        border: "1px solid var(--border-default)",
                        cursor: "pointer",
                      }}
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    >
                      <span
                        className="leads-status-dot"
                        style={{ background: STATUS_COLORS[selectedLead.status as LeadStatus]?.dot || STATUS_COLORS.following.dot }}
                      />
                      {STATUS_LABELS[selectedLead.status as LeadStatus] || selectedLead.status}
                      <HiOutlineChevronDown size={14} />
                    </button>
                  </div>

                  {statusDropdownOpen && (
                    <div className="status-picker-dropdown">
                      {LEAD_STATUSES.map((statusKey) => {
                        const style = STATUS_COLORS[statusKey];
                        const isCurrent = selectedLead.status === statusKey;
                        return (
                          <div
                            key={statusKey}
                            className="status-picker-option"
                            onClick={() => handleStatusChange(selectedLead.id, statusKey)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span className="leads-status-dot" style={{ background: style.dot }} />
                              <span>{STATUS_LABELS[statusKey]}</span>
                            </div>
                            {isCurrent && <HiOutlineCheckCircle size={16} color="var(--primary)" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="leads-detail-info-row">
                  <span className="leads-detail-label">Created</span>
                  <span className="leads-detail-value">{getTimeAgo(selectedLead.createdAt)}</span>
                </div>

                {selectedLead.updatedAt && (
                  <div className="leads-detail-info-row">
                    <span className="leads-detail-label">Last Updated</span>
                    <span className="leads-detail-value">{getTimeAgo(selectedLead.updatedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Create Lead Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => { setShowCreateModal(false); resetCreateForm(); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New Lead</h3>
                <button className="btn-ghost btn-icon" onClick={() => { setShowCreateModal(false); resetCreateForm(); }}>
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ahmed Ali"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>WhatsApp Phone Number</label>
                  <div className="phone-input-group">
                    <CountryCodeSelect value={newCountryCode} onChange={setNewCountryCode} />
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="10xxxxxxxx"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Lead Status</label>
                  <select
                    className="form-input"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                  >
                    {LEAD_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setShowCreateModal(false); resetCreateForm(); }}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                  {creating ? "Adding..." : "Save Lead"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send WhatsApp Message Modal */}
        {showSendModal && sendToLead && (
          <div className="modal-overlay" onClick={() => { setShowSendModal(false); setSendToLead(null); setSelectedMessageId(""); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FaWhatsapp size={20} color="#25D366" />
                  <h3>Send WhatsApp to {sendToLead.name || "Lead"}</h3>
                </div>
                <button className="btn-ghost btn-icon" onClick={() => { setShowSendModal(false); setSendToLead(null); setSelectedMessageId(""); }}>
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              <div className="modal-body">
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 14 }}>
                  Choose one of your saved message templates to open directly in WhatsApp:
                </p>

                {messages.length === 0 ? (
                  <div style={{ background: "#f8fafc", padding: 20, borderRadius: "var(--radius-md)", textAlign: "center" }}>
                    <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>No message templates yet</p>
                    <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      Go to the Messages page to create templates with variables like {"{{name}}"}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
                    {messages.map((msg) => {
                      const isSelected = selectedMessageId === msg.id;
                      const preview = (msg.content || "")
                        .replace(/{{name}}/g, sendToLead.name || "Client")
                        .replace(/{{phone}}/g, sendToLead.phone || "");

                      return (
                        <div
                          key={msg.id}
                          onClick={() => setSelectedMessageId(msg.id)}
                          style={{
                            padding: "12px 14px",
                            borderRadius: "var(--radius-md)",
                            border: `1px solid ${isSelected ? "var(--primary)" : "var(--border-default)"}`,
                            background: isSelected ? "#f0fdf4" : "#ffffff",
                            cursor: "pointer",
                            transition: "var(--ease-smooth)",
                          }}
                        >
                          <p style={{ fontSize: 13, color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
                            {preview}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => { setShowSendModal(false); setSendToLead(null); setSelectedMessageId(""); }}>
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleSendMessage}
                  disabled={!selectedMessageId}
                >
                  <HiOutlinePaperAirplane size={16} /> Open in WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Change Status Modal */}
        {showBulkStatusModal && (
          <div className="modal-overlay" onClick={() => setShowBulkStatusModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <div className="modal-header">
                <h3>Change Status for {selectedIds.length} Leads</h3>
                <button className="btn-ghost btn-icon" onClick={() => setShowBulkStatusModal(false)}>
                  <HiOutlineXMark size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select New Status</label>
                  <select
                    className="form-input"
                    value={bulkTargetStatus}
                    onChange={(e) => setBulkTargetStatus(e.target.value as LeadStatus)}
                  >
                    {LEAD_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowBulkStatusModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleBulkStatusChange}>
                  Apply to {selectedIds.length} Leads
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Single Lead Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDelete}
          title="Delete Lead"
          message="Are you sure you want to delete this lead? This action cannot be undone."
          confirmLabel="Delete Lead"
          loading={deleting}
        />

        {/* Bulk Delete Confirm Dialog */}
        <ConfirmDialog
          isOpen={showBulkDeleteConfirm}
          onClose={() => setShowBulkDeleteConfirm(false)}
          onConfirm={handleBulkDelete}
          title={`Delete ${selectedIds.length} Leads`}
          message={`Are you sure you want to delete these ${selectedIds.length} selected leads? This action cannot be undone.`}
          confirmLabel={`Delete ${selectedIds.length} Leads`}
          loading={bulkDeleting}
        />

        {/* Import Excel Modal */}
        <ImportExcelModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
        />
      </main>
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
