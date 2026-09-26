"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

const APPS = [
  { name: "Zoom", body: "Auto-join live Zoom meetings and fetch cloud recordings.", comingSoon: true },
  { name: "Google Meet", body: "Send MeetFlow assistant to scheduled Google Meet sessions.", comingSoon: true },
  { name: "Google Calendar", body: "Sync upcoming calendar events and configure auto-record rules.", comingSoon: true },
  { name: "HubSpot (CRM)", body: "Attach meeting summaries and action items to CRM contacts.", comingSoon: true },
  { name: "Salesforce (CRM)", body: "Push call notes and opportunity updates automatically.", comingSoon: true },
  { name: "Slack", body: "Post recaps and action items to a channel.", comingSoon: false },
  { name: "Notion", body: "Sync notes into a meeting wiki.", comingSoon: false },
  { name: "Linear", body: "File engineering follow-ups from standup recaps.", comingSoon: false },
  { name: "Asana", body: "Create tasks from extracted action items.", comingSoon: false },
];

export default function IntegrationsPage() {
  const { pushToast } = useToast();
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Integrations</h1>
          <p>Push recaps and action items to the tools your team already uses.</p>
        </div>
      </div>
      <div className="stat-grid">
        {APPS.map((app) => (
          <div key={app.name} className="integ-card">
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
              <strong style={{ fontSize: 15 }}>{app.name}</strong>
              {app.comingSoon && (
                <span className="subbar-pill subbar-pill--ghost" style={{ height: 20, fontSize: 10.5, padding: "0 8px" }}>
                  Coming Soon
                </span>
              )}
            </div>
            <p>{app.body}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                pushToast({
                  variant: app.comingSoon ? "warning" : "success",
                  title: app.comingSoon ? `${app.name} integration coming soon` : `${app.name} connected`,
                })
              }
            >
              {app.comingSoon ? "Request Access" : "Connect"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
