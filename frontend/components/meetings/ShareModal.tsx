"use client";

import React from "react";
import { Modal, ModalHeader } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

export function ShareModal({
  open,
  onClose,
  meetingId,
  title,
}: {
  open: boolean;
  onClose: () => void;
  meetingId: number | null;
  title?: string;
}) {
  const { pushToast } = useToast();
  const link = typeof window !== "undefined" && meetingId ? `${window.location.origin}/meetings/${meetingId}` : "";

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="Share recap" subtitle={title} onClose={onClose} />
      <div className="mf-modal__body">
        <label className="field-label">Share link</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="mf-input" readOnly value={link} />
          <Button
            variant="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(link);
              pushToast({ variant: "success", title: "Link copied to clipboard" });
            }}
          >
            Copy
          </Button>
        </div>
        <label className="field-label">Permissions</label>
        <select className="mf-input" defaultValue="edit">
          <option value="view">Can view</option>
          <option value="comment">Can comment</option>
          <option value="edit">Can edit notes</option>
        </select>

        {/* Placeholder: Team / sharing & collaboration */}
        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px dashed rgba(255, 255, 255, 0.12)",
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <strong style={{ fontSize: 13, color: "#fff" }}>Team & Workspace Collaboration</strong>
            <span className="subbar-pill subbar-pill--ghost" style={{ height: 20, fontSize: 10.5, background: "rgba(255,255,255,0.06)" }}>
              Coming Soon
            </span>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            Multi-user real-time co-editing, shared team channels, and granular role-based permissions are coming soon.
          </p>
        </div>
      </div>
      <div className="mf-modal__footer">
        <span />
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
