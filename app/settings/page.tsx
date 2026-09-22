"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { subscribeToLeads } from "@/services/firebase/leads";
import { exportLeadsToCSV } from "@/lib/utils/csv";
import { FirestoreDocument } from "@/services/firebase/firestore";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import UpgradeModal from "@/components/ui/UpgradeModal";
import ImportExcelModal from "@/components/crm/ImportExcelModal";
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineShieldCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowDownTray,
  HiOutlineSparkles,
  HiOutlineKey,
} from "react-icons/hi2";
import { FaFileExcel } from "react-icons/fa";

function SettingsContent() {
  const { user, activatePromoCode } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [leads, setLeads] = useState<FirestoreDocument[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Promo Code State
  const [promoCode, setPromoCode] = useState("");
  const [activatingCode, setActivatingCode] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToLeads(user.uid, setLeads);
    return () => unsub();
  }, [user]);

  const isPro = String(user?.plan || "").trim().toLowerCase() === "pro";
  const today = new Date().toISOString().split("T")[0];
  const sentToday = user?.lastMessageDate === today ? user?.messagesSentToday || 0 : 0;
  const maxFree = 5;
  const percentageUsed = isPro ? 100 : Math.min(100, Math.round((sentToday / maxFree) * 100));

  async function handleActivatePromo() {
    if (!promoCode.trim()) {
      showToast("Please enter a activation code", "error");
      return;
    }
    setActivatingCode(true);
    try {
      const res = await activatePromoCode(promoCode);
      if (res.success) {
        showToast(res.message, "success");
        setPromoCode("");
      } else {
        showToast(res.message, "error");
      }
    } catch {
      showToast("Failed to activate code", "error");
    } finally {
      setActivatingCode(false);
    }
  }

  const userInitials = (user?.displayName || user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="logip-layout">
      <Sidebar active="settings" />

      <main className="logip-main">
        {/* Header */}
        <div className="logip-header">
          <div className="logip-header-left">
            <div>
              <h1 className="logip-greeting">Account & Settings</h1>
              <p className="logip-subtitle">Manage your profile, quotas, and lead data</p>
            </div>
          </div>
        </div>

        <div className="settings-container">
          {/* Profile Card */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>User Profile</h2>
              <span
                className="leads-status-badge"
                style={{
                  background: isPro ? "#fef3c7" : "#f1f5f9",
                  color: isPro ? "#d97706" : "#475569",
                  fontWeight: 700,
                }}
              >
                {isPro ? "PRO ACCOUNT" : "FREE PLAN"}
              </span>
            </div>

            <div className="settings-profile-header">
              <div className="settings-avatar-big">{userInitials}</div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>{user?.displayName || "Lead Manager"}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{user?.email}</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="leads-detail-info-row">
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}>
                  <HiOutlineUser size={18} />
                  <span>Full Name</span>
                </div>
                <span style={{ fontWeight: 600 }}>{user?.displayName || "Not set"}</span>
              </div>

              <div className="leads-detail-info-row">
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}>
                  <HiOutlineEnvelope size={18} />
                  <span>Email Address</span>
                </div>
                <span style={{ fontWeight: 600 }}>{user?.email}</span>
              </div>

              <div className="leads-detail-info-row">
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)" }}>
                  <HiOutlineShieldCheck size={18} />
                  <span>Subscription Plan</span>
                </div>
                <span style={{ fontWeight: 600, color: isPro ? "#d97706" : "var(--text-primary)" }}>
                  {isPro ? "Pro Plan (Unlimited Active)" : "Free Plan (5 msgs/day)"}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Usage Quota */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <HiOutlineChatBubbleLeftRight size={20} color="var(--primary)" />
                <h2>Daily WhatsApp Quota</h2>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                {isPro ? "Unlimited" : `${sentToday} of ${maxFree} used`}
              </span>
            </div>

            {!isPro && (
              <div>
                <div className="settings-quota-bar">
                  <div
                    className="settings-quota-fill"
                    style={{
                      width: `${percentageUsed}%`,
                      background: percentageUsed >= 100 ? "var(--status-urgent-dot)" : "var(--primary)",
                    }}
                  />
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 10 }}>
                  Resets every 24 hours at midnight. Upgrade to Pro for unlimited daily messages.
                </p>
              </div>
            )}

            {isPro && (
              <p style={{ fontSize: 13, color: "var(--status-done_deal-text)", fontWeight: 600 }}>
                ✨ You have unlimited WhatsApp messaging active on your Pro account.
              </p>
            )}
          </div>

          {/* Data Management (Import Excel / Export CSV) */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Data Management</h2>
            </div>

            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
              Backup your CRM leads or import existing leads directly from an Excel (.xlsx) or CSV file.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowImportModal(true)}
              >
                <FaFileExcel size={15} color="#16a34a" /> Import Excel / CSV Sheet
              </button>

              <button className="btn btn-secondary" onClick={() => exportLeadsToCSV(leads)}>
                <HiOutlineArrowDownTray size={16} /> Export All Leads (CSV)
              </button>
            </div>
          </div>

          {/* Promo Code Activation Box */}
          {!isPro && (
            <div className="settings-card">
              <div className="settings-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <HiOutlineKey size={18} color="var(--primary)" />
                  <h2>Activate Pro with Promo Code</h2>
                </div>
              </div>

              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                Have an activation code or VIP promo? Enter it below to unlock Pro plan instantly:
              </p>

              <div style={{ display: "flex", gap: 10, maxWidth: 400 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter code (e.g. PRO2026)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  style={{ textTransform: "uppercase" }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleActivatePromo}
                  disabled={activatingCode || !promoCode.trim()}
                >
                  {activatingCode ? "Checking..." : "Activate"}
                </button>
              </div>
            </div>
          )}

          {/* Pro Upgrade Banner */}
          {!isPro && (
            <div
              className="settings-card"
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                color: "#ffffff",
                border: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <HiOutlineSparkles size={20} color="#f59e0b" />
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>Upgrade to Pro Plan</h3>
                  </div>
                  <p style={{ fontSize: 13, color: "#94a3b8" }}>
                    Get unlimited messaging, priority WhatsApp direct links, and VIP support.
                  </p>
                </div>
                <button
                  className="btn"
                  style={{ background: "#ffffff", color: "#0f172a", fontWeight: 700 }}
                  onClick={() => setShowUpgrade(true)}
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <ImportExcelModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
