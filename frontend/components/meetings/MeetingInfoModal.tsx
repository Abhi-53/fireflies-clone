"use client";

import React from "react";
import type { MeetingDetail, MeetingListItem } from "@/types/api";
import { Modal, ModalHeader } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatDurationShort, formatTimeOfDay } from "@/lib/format";
import { channelLabel, deriveChannel } from "@/lib/workspace";
import { useSummary } from "@/hooks/api";

function attendanceTimes(meetingDate: string, duration: number, index: number, total: number) {
  const start = new Date(meetingDate).getTime();
  const joinOffset = Math.round((index / Math.max(total, 1)) * Math.min(180, duration * 0.08)) * 1000;
  const leaveOffset = duration * 1000 - index * 4000;
  const join = new Date(start + joinOffset);
  const leave = new Date(start + Math.max(joinOffset + 60000, leaveOffset));
  return {
    join: formatTimeOfDay(join.toISOString()),
    leave: formatTimeOfDay(leave.toISOString()),
    mins: formatDurationShort(Math.max(60, duration - index * 20)),
  };
}

export function MeetingInfoModal({
  meeting,
  open,
  onClose,
}: {
  meeting: MeetingListItem | MeetingDetail | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data } = useSummary(open && meeting ? meeting.id : null);
  if (!meeting) return null;
  const channel = deriveChannel(meeting.title, meeting.id);
  const host = meeting.participants[0];

  return (
    <Modal open={open} onClose={onClose} wide>
      <ModalHeader
        id="meeting-info-title"
        title={meeting.title}
        onClose={onClose}
        subtitle={
          <>
            {host ? `Host: ${host.name}` : "No host"} · {formatDateTime(meeting.meeting_date)} ·{" "}
            {formatDurationShort(meeting.duration_seconds)}
          </>
        }
      />
      <div className="mf-modal__body">
        <p className="mf-snapshot">{data?.summary?.overview_text || "Summary is still generating for this recap."}</p>
        <h3 className="section-h" style={{ marginTop: 16 }}>
          Attended
        </h3>
        <div className="attendee-head">
          <span />
          <span>Name</span>
          <span>Join</span>
          <span>Leave</span>
          <span>Duration</span>
        </div>
        {meeting.participants.map((p, i) => {
          const t = attendanceTimes(meeting.meeting_date, meeting.duration_seconds, i, meeting.participants.length);
          return (
            <div key={p.id} className="attendee-row">
              <Avatar name={p.name} size="xl" />
              <div>
                <strong>{p.name}</strong>
                <div className="muted">{p.email || `${p.name.toLowerCase().replace(/\s+/g, ".")}@meetflow.ai`}</div>
              </div>
              <span className="attendee-time">{t.join}</span>
              <span className="attendee-time">{t.leave}</span>
              <span className="attendee-time">{t.mins}</span>
            </div>
          );
        })}
        <h3 className="section-h">Invited (Absent)</h3>
        <p className="muted">Everyone who was invited attended this session.</p>
        <h3 className="section-h">Channels</h3>
        <div className="keywords">
          <Badge variant="channel">{channelLabel(channel)}</Badge>
          <Button variant="ghost" size="sm">
            + Move to Channel
          </Button>
        </div>
      </div>
      <div className="mf-modal__footer">
        <select className="mf-input mf-privacy-select" defaultValue="workspace">
          <option value="workspace">Who can view this recap: Workspace</option>
          <option value="invite">Who can view this recap: Invite only</option>
          <option value="public">Who can view this recap: Anyone with link</option>
        </select>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
