"use client";

import { useRouter } from "next/navigation";
import {
  HiOutlineUserGroup,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCog6Tooth,
  HiOutlinePlus,
} from "react-icons/hi2";

interface BottomNavProps {
  active: string;
}

export default function BottomNav({ active }: BottomNavProps) {
  const router = useRouter();

  const navItems = [
    { id: "leads", icon: HiOutlineUserGroup, label: "Leads", path: "/crm/leads" },
    {
      id: "messages",
      icon: HiOutlineChatBubbleLeftRight,
      label: "Messages",
      path: "/messages",
    },
    {
      id: "settings",
      icon: HiOutlineCog6Tooth,
      label: "Settings",
      path: "/settings",
    },
  ];

  return (
    <nav className="main-nav">
      <div className="nav-content">
        <div className="nav-logo">
          <span className="nav-logo-text">LM</span>
        </div>

        <div className="nav-items-group">
          {navItems.slice(0, 2).map((item) => (
            <button
              key={item.id}
              className={`nav-item ${active === item.id ? "active" : ""}`}
              onClick={() => router.push(item.path)}
            >
              <item.icon size={22} />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}

          <button
            className="nav-item-center"
            onClick={() => router.push("/crm/leads")}
            title="Add Lead"
          >
            <HiOutlinePlus size={24} />
          </button>

          {navItems.slice(2).map((item) => (
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
  );
}
