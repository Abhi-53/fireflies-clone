"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

export function Modal({
  open,
  onClose,
  children,
  labelledBy,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="mf-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="mf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        style={wide ? { maxWidth: 680 } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
  id,
}: {
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  id?: string;
}) {
  return (
    <div className="mf-modal__header">
      <div>
        <h2 className="mf-modal__title" id={id}>
          {title}
        </h2>
        {subtitle ? <div className="muted" style={{ marginTop: 4 }}>{subtitle}</div> : null}
      </div>
      <Button variant="icon" aria-label="Close" onClick={onClose}>
        <X size={16} />
      </Button>
    </div>
  );
}
