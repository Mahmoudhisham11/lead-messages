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
  HiOutlineArrowUp,
} from "react-icons/hi2";

interface SidebarProps {
  active: string;
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
  const isPro = user?.plan === "pro";

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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="6" fill="#000" />
                <path d="M7 8h10M7 12h6M7 16h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="logip-logo-text">Lead Messages</span>
            </div>

            <nav className="logip-nav">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`logip-nav-item ${active === item.id ? "active" : ""}`}
                  onClick={() => router.push(item.path)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="logip-sidebar-bottom">
            {!isPro && (
              <div className="logip-upgrade-card">
                <h4>Upgrade to Pro</h4>
                <p>Get unlimited messages per day</p>
                <button className="logip-upgrade-btn" onClick={() => setShowUpgrade(true)}>
                  Upgrade
                </button>
              </div>
            )}

            <button className="logip-nav-item logip-logout" onClick={handleLogout}>
              <HiOutlineArrowRightOnRectangle size={20} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="main-nav mobile-nav">
        <div className="nav-content">
          <div className="nav-items-group">
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${active === item.id ? "active" : ""}`}
                onClick={() => router.push(item.path)}
              >
                <item.icon size={22} />
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
