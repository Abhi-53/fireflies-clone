"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bot,
  CloudUpload,
  FolderKanban,
  Hash,
  Plus,
  Search,
} from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { cx } from "@/lib/format";

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "my";
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const [channelSearch, setChannelSearch] = useState("");

  const isMyMeetingsActive =
    (pathname === "/meetings" && (tab === "my" || !searchParams.has("tab"))) ||
    pathname === "/channels/my";

  const isAllMeetingsActive =
    (pathname === "/meetings" && tab === "all") || pathname === "/channels/all";

  const isVoiceAgentsActive =
    (pathname === "/meetings" && tab === "voice-agents") || pathname === "/channels/voice-agents";

  const isUploadsActive =
    (pathname === "/meetings" && tab === "uploads") ||
    pathname === "/meetings/new" ||
    pathname === "/channels/uploads";

  return (
    <>
      {mobileOpen ? <div className="sidebar-backdrop" onClick={closeMobile} /> : null}
      <aside className={cx("sub-sidebar", collapsed && "is-collapsed", mobileOpen && "is-mobile-open")}>
        <div className="sub-sidebar__header">
          <div className="sub-sidebar__search">
            <Search size={14} className="sub-sidebar__search-icon" />
            <input
              type="text"
              className="sub-sidebar__search-input"
              placeholder="Search channels"
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              aria-label="Search channels"
            />
          </div>
        </div>

        <div className="sub-sidebar__content">
          <nav className="sub-sidebar__nav">
            <Link
              href="/meetings?tab=my"
              className={cx("channel-item", isMyMeetingsActive && "is-active")}
              onClick={closeMobile}
            >
              <Hash size={16} />
              <span>My Meetings</span>
            </Link>

            <Link
              href="/meetings?tab=all"
              className={cx("channel-item", isAllMeetingsActive && "is-active")}
              onClick={closeMobile}
            >
              <FolderKanban size={16} />
              <span>All Meetings</span>
            </Link>

            <Link
              href="/meetings?tab=voice-agents"
              className={cx("channel-item", isVoiceAgentsActive && "is-active")}
              onClick={closeMobile}
            >
              <Bot size={16} />
              <span>Voice Agent Meetings</span>
            </Link>

            <Link
              href="/meetings/new"
              className={cx("channel-item", isUploadsActive && "is-active")}
              onClick={closeMobile}
            >
              <CloudUpload size={16} />
              <span style={{ flex: 1 }}>Uploads</span>
              <span className="badge-new">NEW</span>
            </Link>
          </nav>

          <div className="sub-sidebar__section-title">All channels</div>

          <div className="sub-sidebar__channels-empty">
            <div className="channels-empty__icon">
              <Hash size={24} />
            </div>
            <p className="channels-empty__text">
              Create channels to organize your conversations
            </p>
            <button
              type="button"
              className="channels-empty__btn"
              onClick={() => alert("Channel creation will be available soon.")}
            >
              <Plus size={14} />
              Channel
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
