import React from "react";
import { Check, Clock } from "lucide-react";
import { cx } from "@/lib/format";

export function Badge({
  children,
  variant = "completed",
  className,
}: {
  children: React.ReactNode;
  variant?: "live" | "processing" | "completed" | "ai" | "channel";
  className?: string;
}) {
  return (
    <span className={cx("mf-badge", `mf-badge--${variant}`, className)}>
      {variant === "live" && <span className="mf-pulse" />}
      {variant === "completed" && <Check size={12} strokeWidth={2.5} />}
      {variant === "processing" && <Clock size={12} />}
      {children}
    </span>
  );
}
