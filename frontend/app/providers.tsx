"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/context/ToastContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { ToastViewport } from "@/components/ui/Toast";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 15_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <SidebarProvider>
          {children}
          <ToastViewport />
        </SidebarProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
