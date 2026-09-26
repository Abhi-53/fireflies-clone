"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bot,
  ChevronDown,
  Search,
  Video,
} from "lucide-react";
import { CURRENT_USER } from "@/lib/workspace";
import { useToast } from "@/context/ToastContext";
import { GlobalSearchModal } from "./GlobalSearchModal";

export function TopNavbar({
  onToggleFred,
  isFredOpen,
}: {
  onToggleFred?: () => void;
  isFredOpen?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { pushToast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const getPageTitle = () => {
    if (pathname.startsWith("/meetings/") && pathname !== "/meetings/new") return "Meeting Notepad";
    if (pathname === "/meetings/new") return "Upload Recording";
    if (pathname === "/dashboard") return "Home";
    if (pathname === "/analytics") return "Analytics";
    if (pathname === "/soundbites") return "Soundbites";
    if (pathname === "/integrations") return "Integrations";
    if (pathname === "/apps") return "AI Apps";
    if (pathname === "/settings") return "Settings";
    return "Meetings";
  };

  return (
    <header className="app-navbar" role="navigation">
      <div className="app-navbar__left">
        <h1 className="app-navbar__title">{getPageTitle()}</h1>
      </div>

      <div className="app-navbar__center">
        <div
          className="app-navbar__search-box"
          onClick={() => setSearchOpen(true)}
          role="button"
          tabIndex={0}
        >
          <Search size={15} className="app-navbar__search-icon" />
          <span className="app-navbar__search-placeholder">
            Search by title or keyword
          </span>
          <kbd className="app-navbar__kbd">Ctrl + K</kbd>
        </div>
      </div>

      <div className="app-navbar__right">
        {/* Free meetings counter pill */}
        <div className="free-meetings-pill" title="Free meeting credits remaining">
          <span className="free-meetings-badge">{CURRENT_USER.credits}</span>
          <span className="free-meetings-text">Free meetings</span>
        </div>

        {/* Upgrade dark green button */}
        <button
          type="button"
          className="btn-upgrade-green"
          onClick={() => pushToast({ variant: "success", title: "Upgrade to Business", body: "Plans start at $10/mo." })}
        >
          Upgrade
        </button>

        {/* Notification bell with red dot */}
        <button
          type="button"
          className="app-navbar__icon-btn"
          aria-label="Notifications"
          style={{ position: "relative" }}
          onClick={() => pushToast({ variant: "success", title: "No new alerts", body: "You are all caught up!" })}
        >
          <Bell size={18} />
          <span className="notif-badge-red" />
        </button>

        {/* Capture purple button */}
        <button
          type="button"
          className="btn-capture-purple"
          onClick={() => router.push("/meetings/new")}
        >
          <Video size={16} />
          <span>Capture</span>
          <ChevronDown size={14} />
        </button>

        {/* Ask Fred panel toggle button */}
        {onToggleFred && (
          <button
            type="button"
            className={`app-navbar__icon-btn ${isFredOpen ? "is-active" : ""}`}
            title={isFredOpen ? "Hide Ask Fred" : "Show Ask Fred"}
            aria-label="Toggle Ask Fred AI Copilot"
            onClick={onToggleFred}
          >
            <Bot size={18} />
          </button>
        )}
      </div>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
