"use client";

import Link from "next/link";
import { useMeetings } from "@/hooks/api";
import { Skeleton } from "@/components/ui/EmptyState";
import { formatDateTime, formatDurationShort } from "@/lib/format";
import { CURRENT_USER } from "@/lib/workspace";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading } = useMeetings({ limit: 8, sort: "recent" });
  const total = data?.total ?? 0;
  const actions = (data?.items ?? []).reduce((n, m) => n + m.action_items_count, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Home</h1>
          <p>Activity across your MeetFlow workspace.</p>
        </div>
        <Button variant="primary" onClick={() => router.push("/meetings/new")}>
          Upload
        </Button>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Meetings</span>
          <strong>{isLoading ? "—" : total}</strong>
        </div>
        <div className="stat-card">
          <span>Open action items</span>
          <strong>{isLoading ? "—" : actions}</strong>
        </div>
        <div className="stat-card">
          <span>AI credits</span>
          <strong>{CURRENT_USER.credits}</strong>
        </div>
        <div className="stat-card">
          <span>Upcoming</span>
          <strong>0</strong>
        </div>
      </div>
      <h2 className="section-h">Recent notes</h2>
      {isLoading && <Skeleton height={64} />}
      <div className="dash-list">
        {(data?.items ?? []).map((m) => (
          <Link key={m.id} href={`/meetings/${m.id}`} className="meeting-row">
            <span />
            <div>
              <div className="meeting-row__title">{m.title}</div>
              <div className="meeting-row__meta">
                {formatDateTime(m.meeting_date)} · {formatDurationShort(m.duration_seconds)}
              </div>
            </div>
            <span className="muted">{m.participants.length} attendees</span>
            <span className="muted dur-col">{m.action_items_count} tasks</span>
            <span />
            <span style={{ textAlign: "right" }}>
              <Badge variant="completed">Completed</Badge>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
