"use client";

import React from "react";
import { Copy, MessageSquare, Play, Scissors } from "lucide-react";
import type { TranscriptSegment } from "@/types/api";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatSecondsToTime, cx } from "@/lib/format";
import { useToast } from "@/context/ToastContext";

function SpokenText({
  text,
  start,
  end,
  currentTime,
  active,
}: {
  text: string;
  start: number;
  end?: number | null;
  currentTime: number;
  active: boolean;
}) {
  const tokens = text.split(/(\s+)/);
  const wordCount = tokens.filter((t) => t.trim().length).length;
  const span = Math.max((end ?? start + Math.max(4, wordCount * 0.38)) - start, 0.4);
  const progress = active ? Math.min(0.999, Math.max(0, (currentTime - start) / span)) : 0;
  const currentIdx = active ? Math.floor(progress * wordCount) : -1;
  let wi = 0;

  return (
    <p className="utterance__body">
      {tokens.map((tok, i) => {
        if (!tok.trim()) return <React.Fragment key={i}>{tok}</React.Fragment>;
        const idx = wi++;
        return (
          <span
            key={i}
            className={cx("word", idx === currentIdx && "is-current", idx < currentIdx && "is-spoken")}
          >
            {tok}
          </span>
        );
      })}
    </p>
  );
}

export function UtteranceBlock({
  segment,
  active,
  editing,
  nameOverride,
  currentTime,
  onSeek,
  onRename,
  onChangeText,
}: {
  segment: TranscriptSegment;
  active: boolean;
  editing: boolean;
  nameOverride?: string;
  currentTime: number;
  onSeek: (t: number) => void;
  onRename: (name: string) => void;
  onChangeText: (text: string) => void;
}) {
  const { pushToast } = useToast();
  const name = nameOverride || segment.speaker_name;

  return (
    <article className={cx("utterance", active && "is-active")}>
      <Avatar name={name} size="lg" />
      <div>
        <div className="utterance__head">
          <input
            className="utterance__name"
            value={name}
            onChange={(e) => onRename(e.target.value)}
            aria-label="Speaker name"
          />
          <button type="button" className="utterance__time" onClick={() => onSeek(segment.start_time_seconds)}>
            {formatSecondsToTime(segment.start_time_seconds)}
          </button>
        </div>
        {editing ? (
          <textarea
            className="mf-textarea"
            value={segment.text}
            onChange={(e) => onChangeText(e.target.value)}
          />
        ) : (
          <SpokenText
            text={segment.text}
            start={segment.start_time_seconds}
            end={segment.end_time_seconds}
            currentTime={currentTime}
            active={active}
          />
        )}
      </div>
      <div className="hover-toolbar">
        <Button variant="icon" aria-label="Play from here" onClick={() => onSeek(segment.start_time_seconds)}>
          <Play size={14} />
        </Button>
        <Button
          variant="icon"
          aria-label="Add comment"
          onClick={() =>
            pushToast({ variant: "success", title: "Comment anchored", body: "Comment thread opened at this timestamp." })
          }
        >
          <MessageSquare size={14} />
        </Button>
        <Button
          variant="icon"
          aria-label="Create soundbite"
          onClick={() => pushToast({ variant: "success", title: "Soundbite created" })}
        >
          <Scissors size={14} />
        </Button>
        <Button
          variant="icon"
          aria-label="Copy text"
          onClick={async () => {
            await navigator.clipboard.writeText(segment.text);
            pushToast({ variant: "success", title: "Copied utterance" });
          }}
        >
          <Copy size={14} />
        </Button>
      </div>
    </article>
  );
}
