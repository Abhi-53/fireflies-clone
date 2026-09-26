"use client";

import { useMeetings } from "@/hooks/api";
import { CURRENT_USER } from "@/lib/workspace";

export default function AnalyticsPage() {
  const { data } = useMeetings({ limit: 50 });
  const meetings = data?.items ?? [];
  const hours = meetings.reduce((n, m) => n + m.duration_seconds, 0) / 3600;
  const speakers = new Map<string, number>();
  meetings.forEach((m) => {
    m.participants.forEach((p) => {
      speakers.set(p.name, (speakers.get(p.name) || 0) + m.duration_seconds / Math.max(m.participants.length, 1));
    });
  });
  const ranked = Array.from(speakers.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const max = ranked[0]?.[1] || 1;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Conversation intelligence across talk time, recap volume, and follow-through.</p>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Recorded hours</span>
          <strong>{hours.toFixed(1)}</strong>
        </div>
        <div className="stat-card">
          <span>Meetings indexed</span>
          <strong>{data?.total ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Avg duration</span>
          <strong>
            {meetings.length
              ? `${Math.round(meetings.reduce((n, m) => n + m.duration_seconds, 0) / meetings.length / 60)}m`
              : "—"}
          </strong>
        </div>
        <div className="stat-card">
          <span>Action density</span>
          <strong>
            {meetings.length
              ? (meetings.reduce((n, m) => n + m.action_items_count, 0) / meetings.length).toFixed(1)
              : "—"}
          </strong>
        </div>
      </div>
      <div className="stat-card">
        <span>Speaker talk-time mix</span>
        <p className="muted" style={{ marginTop: 8 }}>
          Estimated share of recorded time across attendees in {CURRENT_USER.workspace}.
        </p>
        {ranked.map(([name, secs]) => (
          <div key={name} className="talk-bar">
            <span style={{ width: 140, fontSize: 13, fontWeight: 600 }}>{name}</span>
            <div className="talk-bar__track">
              <div className="talk-bar__fill" style={{ width: `${Math.round((secs / max) * 100)}%` }} />
            </div>
            <span className="muted">{Math.round(secs / 60)}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}
