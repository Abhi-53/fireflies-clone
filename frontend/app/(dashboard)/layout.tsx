"use client";

import React, { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="app-shell" />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
