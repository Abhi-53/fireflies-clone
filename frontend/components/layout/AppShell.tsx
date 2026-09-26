"use client";

import React, { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { PromoBanner } from "./PromoBanner";
import { AppRail } from "./AppRail";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { AskFredPanel } from "./AskFredPanel";
import { cx } from "@/lib/format";

export function AppShell({
  children,
  meetingTitle,
}: {
  children: React.ReactNode;
  meetingTitle?: string;
}) {
  const pathname = usePathname();
  const isMeetingDetail = pathname.startsWith("/meetings/") && pathname !== "/meetings/new";
  const [isFredOpen, setIsFredOpen] = useState(!isMeetingDetail);

  return (
    <div className="app-shell-root">
      <PromoBanner />

      <div className="app-shell-container">
        <AppRail />

        <Suspense fallback={<aside className="sub-sidebar" />}>
          <Sidebar />
        </Suspense>

        <div className="workspace-container">
          <TopNavbar
            onToggleFred={() => setIsFredOpen((prev) => !prev)}
            isFredOpen={isFredOpen}
          />

          <main className={cx("main-workspace", isMeetingDetail && "is-detail")}>
            {children}
          </main>
        </div>

        {/* Ask Fred right panel */}
        <AskFredPanel open={isFredOpen} onClose={() => setIsFredOpen(false)} />
      </div>
    </div>
  );
}
