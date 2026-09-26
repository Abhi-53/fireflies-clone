"use client";

import React from "react";
import { avatarPalette, cx, getInitials } from "@/lib/format";

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "xs" | "md" | "lg" | "xl";
  className?: string;
}) {
  const palette = avatarPalette(name);
  return (
    <span
      className={cx("mf-avatar", `mf-avatar--${size}`, className)}
      style={{ background: palette.bg, color: palette.fg }}
      title={name}
    >
      {getInitials(name)}
    </span>
  );
}

export function AvatarStack({
  names,
  max = 3,
  onMoreClick,
}: {
  names: string[];
  max?: number;
  onMoreClick?: (e: React.MouseEvent) => void;
}) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className="mf-avatar-stack">
      {shown.map((n) => (
        <Avatar key={n} name={n} size="xs" />
      ))}
      {extra > 0 && (
        <button type="button" className="mf-avatar-more" onClick={onMoreClick}>
          +{extra}
        </button>
      )}
    </div>
  );
}
