"use client";

import React, { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";

export function Dropdown({
  trigger,
  children,
  align = "right",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cx("mf-menu")}
          style={{ top: "calc(100% + 6px)", [align === "right" ? "right" : "left"]: 0 }}
          role="menu"
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  danger,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button type="button" className={cx("mf-menu__item", danger && "mf-menu__item--danger")} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}

export function MenuDivider() {
  return <div className="mf-menu__divider" />;
}
