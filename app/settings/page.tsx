"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import UpgradeModal from "@/components/ui/UpgradeModal";
import {
  HiOutlineArrowLeft,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineShieldCheck,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";

function SettingsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isPro = user?.plan === "pro";
  const today = new Date().toISOString().split("T")[0];
  const sentToday = user?.lastMessageDate === today ? user?.messagesSentToday || 0 : 0;
  const remaining = isPro ? "Unlimited" : Math.max(0, 5 - sentToday);

  return (
    <div className="logip-layout">
      <Sidebar active="settings" />

      <main className="logip-main">
        <div className="logip-header">
          <div className="logip-header-left">
            <button className="logip-back-btn" onClick={() => router.back()}>
              <HiOutlineArrowLeft size={20} />
            </button>
            <div>
              <h1 className="logip-greeting">Settings</h1>
              <p className="logip-subtitle">Manage your account</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="logip-card">
          <div className="logip-card-header"><h2>Profile</h2></div>
          <div className="logip-user-info">
            <div className="logip-avatar">
              {user?.displayName?.[0] || user?.email?.[0] || "?"}
            </div>
            <div>
              <div className="logip-user-name">{user?.displayName || "User"}</div>
              <div className="logip-user-email">{user?.email}</div>
            </div>
          </div>

          <div className="settings-info-grid">
            <div className="settings-info-row">
              <div className="settings-info-label">
                <HiOutlineUser size={16} />
                <span>Name</span>
              </div>
              <span className="settings-info-value">{user?.displayName || "-"}</span>
            </div>
            <div className="settings-info-row">
              <div className="settings-info-label">
                <HiOutlineEnvelope size={16} />
                <span>Email</span>
              </div>
              <span className="settings-info-value">{user?.email || "-"}</span>
            </div>
            <div className="settings-info-row">
              <div className="settings-info-label">
                <HiOutlineShieldCheck size={16} />
                <span>Plan</span>
              </div>
              <span className={`settings-plan-badge ${isPro ? "pro" : "free"}`}>
                {isPro ? "Pro" : "Free"}
              </span>
            </div>
            <div className="settings-info-row">
              <div className="settings-info-label">
                <HiOutlineChatBubbleLeftRight size={16} />
                <span>Messages Today</span>
              </div>
              <span className="settings-info-value">
                {isPro ? "Unlimited" : `${sentToday} / 5`}
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade Section */}
        {!isPro && (
          <div className="logip-card" style={{ marginTop: 16 }}>
            <div className="settings-upgrade-section">
              <div>
                <h3 className="settings-upgrade-title">Upgrade to Pro</h3>
                <p className="settings-upgrade-desc">
                  Get unlimited messages per day and unlock all features
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowUpgrade(true)}>
                Upgrade
              </button>
            </div>
          </div>
        )}
      </main>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
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
