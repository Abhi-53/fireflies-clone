"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

export default function SettingsPage() {
  const { pushToast } = useToast();
  const [template, setTemplate] = useState("General Summary");

  return (
    <div className="page" id="settings-view" style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Workspace defaults for AI templates, teammates, and billing.</p>
        </div>
      </div>
      <label className="field-label">Default AI summary template</label>
      <select className="mf-input" value={template} onChange={(e) => setTemplate(e.target.value)}>
        <option>General Summary</option>
        <option>Team Meeting</option>
        <option>1:1 Meeting</option>
        <option>Sales Call (BANT)</option>
        <option>Interview Evaluation</option>
        <option>Standup</option>
      </select>
      <p className="muted" style={{ marginTop: 8 }}>
        Applied to new recaps for everyone in MeetFlow HQ. Individual meetings can still switch templates in the notepad.
      </p>
      <label className="field-label">Workspace name</label>
      <input className="mf-input" defaultValue="MeetFlow HQ" />
      <div style={{ marginTop: 20 }}>
        <Button
          variant="primary"
          onClick={() => pushToast({ variant: "success", title: "Workspace preferences saved" })}
        >
          Save changes
        </Button>
      </div>

      {/* Placeholder: Real user authentication */}
      <div
        style={{
          marginTop: 32,
          padding: "16px 18px",
          background: "#13141d",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <strong style={{ color: "#fff", fontSize: 14 }}>Real User Authentication & SSO</strong>
          <span className="subbar-pill subbar-pill--ghost" style={{ height: 22, fontSize: 11, background: "rgba(255,255,255,0.08)" }}>
            Coming Soon
          </span>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>
          Currently active as default demo user <strong>Abhi</strong> (abhi@meetflow.ai). Google OAuth, SAML Single Sign-On (SSO), and session management are planned for upcoming releases.
        </p>
      </div>

      {/* Placeholder: Team / sharing & collaboration */}
      <div
        style={{
          marginTop: 16,
          padding: "16px 18px",
          background: "#13141d",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <strong style={{ color: "#fff", fontSize: 14 }}>Team Members & Role-Based Permissions</strong>
          <span className="subbar-pill subbar-pill--ghost" style={{ height: 22, fontSize: 11, background: "rgba(255,255,255,0.08)" }}>
            Coming Soon
          </span>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5 }}>
          Manage workspace team invitations, department channels, and permission policies across MeetFlow.
        </p>
      </div>
    </div>
  );
}
