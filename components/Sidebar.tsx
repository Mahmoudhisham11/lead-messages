"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import UpgradeModal from "@/components/ui/UpgradeModal";
import {
  HiOutlineUserGroup,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineSparkles,
} from "react-icons/hi2";

interface SidebarProps {
  active: "leads" | "messages" | "settings";
}

const navItems = [
  { id: "leads", icon: HiOutlineUserGroup, label: "Leads", path: "/crm/leads" },
  { id: "messages", icon: HiOutlineChatBubbleLeftRight, label: "Messages", path: "/messages" },
  { id: "settings", icon: HiOutlineCog6Tooth, label: "Settings", path: "/settings" },
];

export default function Sidebar({ active }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isPro = String(user?.plan || "").trim().toLowerCase() === "pro";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="logip-sidebar desktop-sidebar">
        <div className="logip-sidebar-inner">
          <div className="logip-sidebar-top">
            <div className="logip-logo">
              <div className="logip-logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M7 8h10M7 12h7M7 16h5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  <rect x="2" y="3" width="20" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="logip-logo-text">Lead Messages</span>
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>CRM & WhatsApp</span>
              </div>
            </div>

            <nav className="logip-nav">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    className={`logip-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => router.push(item.path)}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="logip-sidebar-bottom">
            {!isPro && (
              <div className="logip-upgrade-card">
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <HiOutlineSparkles size={16} color="#f59e0b" />
                  <h4>Upgrade to Pro</h4>
                </div>
                <p>Send unlimited WhatsApp messages and unlock all features</p>
                <button className="logip-upgrade-btn" onClick={() => setShowUpgrade(true)}>
                  Upgrade Account
                </button>
              </div>
            )}

            <button className="logip-nav-item logip-logout" onClick={handleLogout}>
              <HiOutlineArrowRightOnRectangle size={19} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <div className="nav-content">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => router.push(item.path)}
              >
                <Icon size={22} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
