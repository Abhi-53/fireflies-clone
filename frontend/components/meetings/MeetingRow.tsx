"use client";

import React from "react";
import { Bot, Globe, Laptop, Mic, MoreHorizontal, Share2, Upload } from "lucide-react";
import type { MeetingListItem } from "@/types/api";
import { channelLabel, CURRENT_USER, deriveCaptureSource, deriveChannel } from "@/lib/workspace";
import { cx, formatDateTime, formatDurationShort } from "@/lib/format";
import { AvatarStack } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dropdown, MenuDivider, MenuItem } from "@/components/ui/Dropdown";

const SOURCE_ICON: Record<string, React.ReactNode> = {
  "voice-agent": <Bot size={16} />,
  extension: <Globe size={16} />,
  desktop: <Laptop size={16} />,
  recording: <Mic size={16} />,
  upload: <Upload size={16} />,
};

export function MeetingRow({
  meeting,
  selected,
  onToggle,
  onOpen,
  onDetails,
  onShare,
  onRename,
  onDelete,
}: {
  meeting: MeetingListItem;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onDetails: () => void;
  onShare: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const channel = deriveChannel(meeting.title, meeting.id);
  const source = deriveCaptureSource(meeting.id, meeting.media_url);
  const names = meeting.participants.map((p) => p.name);
  const host = meeting.participants[0]?.name || CURRENT_USER.name;

  return (
    <div
      className={cx("meeting-row", selected && "is-selected")}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      role="row"
      tabIndex={0}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="mf-checkbox meeting-row__check"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${meeting.title}`}
        />
      </div>
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ color: "var(--grey-500)", marginTop: 2 }} title={source}>
            {SOURCE_ICON[source]}
          </span>
          <div>
            <div className="meeting-row__title">{meeting.title}</div>
            <div className="meeting-row__meta">
              <span>Host: {host}</span>
              <span>·</span>
              <Badge variant="channel">{channelLabel(channel)}</Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="muted">
        {formatDateTime(meeting.meeting_date)}
        <div style={{ marginTop: 2 }}>({formatDurationShort(meeting.duration_seconds)})</div>
      </div>
      <div className="muted dur-col">{formatDurationShort(meeting.duration_seconds)}</div>
      <div onClick={(e) => e.stopPropagation()}>
        <AvatarStack
          names={names}
          onMoreClick={(e) => {
            e.stopPropagation();
            onDetails();
          }}
        />
      </div>
      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" onClick={onDetails}>
          Details
        </Button>
        <Button variant="icon" aria-label="Share" onClick={onShare}>
          <Share2 size={14} />
        </Button>
        <Dropdown
          trigger={
            <Button variant="icon" aria-label="More">
              <MoreHorizontal size={16} />
            </Button>
          }
        >
          <MenuItem onClick={onRename}>Rename</MenuItem>
          <MenuItem onClick={onDetails}>Move to Channel</MenuItem>
          <MenuItem onClick={onOpen}>Download (Transcript/Summary/Audio)</MenuItem>
          <MenuDivider />
          <MenuItem danger onClick={onDelete}>
            Delete
          </MenuItem>
        </Dropdown>
      </div>
    </div>
  );
}
