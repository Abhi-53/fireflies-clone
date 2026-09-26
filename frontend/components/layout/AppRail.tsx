"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Bot,
  Home,
  Layers,
  List,
  Settings,
  Sparkles,
  UserPlus,
  Video,
  Zap,
} from "lucide-react";
import { CURRENT_USER } from "@/lib/workspace";
import { cx } from "@/lib/format";

export function AppRail() {
  const pathname = usePathname();

  const isMeetingsActive = pathname.startsWith("/meetings") || pathname.startsWith("/channels");

  return (
    <aside className="app-rail" aria-label="Primary navigation rail">
      <div className="app-rail__top">
        <div className="app-rail__avatar" title={`${CURRENT_USER.name} (${CURRENT_USER.workspace})`}>
          <span>{CURRENT_USER.name.charAt(0).toUpperCase()}</span>
        </div>

        <nav className="app-rail__nav">
          <Link
            href="/dashboard"
            className={cx("app-rail__btn", pathname === "/dashboard" && "is-active")}
            title="Home"
            aria-label="Home"
          >
            <Home size={18} />
          </Link>

          <Link
            href="/meetings"
            className={cx("app-rail__btn", isMeetingsActive && "is-active")}
            title="Meetings"
            aria-label="Meetings"
          >
            <Bot size={18} />
          </Link>

          <Link
            href="/meetings?tab=video"
            className={cx("app-rail__btn", pathname.includes("tab=video") && "is-active")}
            title="Record Video"
            aria-label="Record Video"
          >
            <Video size={18} />
          </Link>

          <Link
            href="/soundbites"
            className={cx("app-rail__btn", pathname === "/soundbites" && "is-active")}
            title="Soundbites & Transcripts"
            aria-label="Soundbites & Transcripts"
          >
            <List size={18} />
          </Link>

          <Link
            href="/apps"
            className={cx("app-rail__btn", pathname === "/apps" && "is-active")}
            title="AI Apps & Skills"
            aria-label="AI Apps & Skills"
          >
            <Sparkles size={18} />
          </Link>

          <Link
            href="/analytics"
            className={cx("app-rail__btn", pathname === "/analytics" && "is-active")}
            title="Analytics"
            aria-label="Analytics"
          >
            <BarChart2 size={18} />
          </Link>

          <button
            type="button"
            className="app-rail__btn"
            title="Ask Fred AI Assistant"
            aria-label="Ask Fred AI Assistant"
          >
            <Bot size={18} />
          </button>

          <Link
            href="/integrations"
            className={cx("app-rail__btn", pathname === "/integrations" && "is-active")}
            title="Automations & Integrations"
            aria-label="Automations & Integrations"
            style={{ position: "relative" }}
          >
            <Zap size={18} />
            <span className="app-rail__badge-dot" />
          </Link>
        </nav>
      </div>

      <div className="app-rail__bottom">
        <button
          type="button"
          className="app-rail__btn"
          title="Invite Teammates"
          aria-label="Invite Teammates"
        >
          <UserPlus size={18} />
        </button>

        <Link
          href="/integrations"
          className="app-rail__btn"
          title="Integrations & API"
          aria-label="Integrations & API"
        >
          <Layers size={18} />
        </Link>

        <Link
          href="/settings"
          className={cx("app-rail__btn", pathname === "/settings" && "is-active")}
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
        </Link>
      </div>
    </aside>
  );
}
