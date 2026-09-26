"use client";

import React, { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { useTranscript, useTranscriptSearch, useUploadTranscriptText } from "@/hooks/api";
import { usePlayerSync } from "@/context/PlayerSyncContext";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { formatSecondsToTime } from "@/lib/format";
import type { TranscriptSegment } from "@/types/api";
import { UtteranceBlock } from "./UtteranceBlock";
import { useToast } from "@/context/ToastContext";

function toRaw(segments: TranscriptSegment[], names: Record<number, string>) {
  return segments
    .map((s) => {
      const t = formatSecondsToTime(s.start_time_seconds);
      const padded = t.length === 5 ? `00:${t}` : t;
      return `[${padded}] ${names[s.speaker_id] || s.speaker_name}: ${s.text}`;
    })
    .join("\n");
}

export function TranscriptPane({
  meetingId,
  keywordFilter,
  focusFind,
}: {
  meetingId: number;
  keywordFilter?: string | null;
  focusFind?: boolean;
}) {
  const { data, isLoading, isError, error, refetch } = useTranscript(meetingId);
  const { currentTime, activeSegmentId, setActiveSegmentId, seekTo, isPlaying } = usePlayerSync();
  const [query, setQuery] = useState("");
  const [speaker, setSpeaker] = useState("all");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TranscriptSegment[]>([]);
  const [history, setHistory] = useState<TranscriptSegment[][]>([]);
  const [future, setFuture] = useState<TranscriptSegment[][]>([]);
  const [names, setNames] = useState<Record<number, string>>({});
  const find = query || keywordFilter || "";
  const search = useTranscriptSearch(meetingId, find);
  const save = useUploadTranscriptText(meetingId);
  const { pushToast } = useToast();

  const segments = editing ? draft : data?.segments ?? [];
  const speakers = data?.speakers ?? [];

  const activeId = useMemo(() => {
    const list = data?.segments ?? [];
    const found = list.find((s, i) => {
      const next = list[i + 1];
      const end = s.end_time_seconds ?? next?.start_time_seconds ?? s.start_time_seconds + 8;
      return currentTime >= s.start_time_seconds && currentTime < end;
    });
    return found?.id ?? null;
  }, [data, currentTime]);

  React.useEffect(() => {
    if (activeId !== activeSegmentId) setActiveSegmentId(activeId);
  }, [activeId, activeSegmentId, setActiveSegmentId]);

  React.useEffect(() => {
    if (!isPlaying || !activeId) return;
    const el = document.querySelector(`[data-seg="${activeId}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId, isPlaying]);

  const startEdit = () => {
    const copy = (data?.segments ?? []).map((s) => ({ ...s }));
    setDraft(copy);
    setHistory([]);
    setFuture([]);
    setEditing(true);
  };

  const pushHist = (next: TranscriptSegment[]) => {
    setHistory((h) => [...h, draft]);
    setFuture([]);
    setDraft(next);
  };

  const matchIds = new Set((search.data?.matches ?? []).map((m) => m.segment_id));
  const useServerFilter = find.trim().length >= 2 && !!search.data;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
      {editing && (
        <div className="edit-banner">
          <Button
            variant="ghost"
            size="sm"
            disabled={!history.length}
            onClick={() => {
              const prev = history[history.length - 1];
              if (!prev) return;
              setFuture((f) => [draft, ...f]);
              setHistory((h) => h.slice(0, -1));
              setDraft(prev);
            }}
          >
            Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!future.length}
            onClick={() => {
              const nxt = future[0];
              if (!nxt) return;
              setHistory((h) => [...h, draft]);
              setFuture((f) => f.slice(1));
              setDraft(nxt);
            }}
          >
            Redo
          </Button>
          <div style={{ flex: 1 }} />
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              await save.mutateAsync(toRaw(draft, names));
              setEditing(false);
              pushToast({ variant: "success", title: "Transcript saved" });
            }}
          >
            Save Changes
          </Button>
        </div>
      )}
      <div className="transcript-controls">
        <div style={{ flex: 1 }}>
          <SearchInput
            compact
            autoFocus={focusFind}
            value={query}
            onChange={setQuery}
            placeholder="Find in transcript..."
          />
        </div>
        <select
          className="mf-input mf-input--compact"
          style={{ width: 140 }}
          value={speaker}
          onChange={(e) => setSpeaker(e.target.value)}
          aria-label="Filter speaker"
        >
          <option value="all">All speakers</option>
          {speakers.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {names[s.id] || s.name}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="sm" onClick={startEdit}>
          <Pencil size={14} />
          Edit
        </Button>
      </div>
      <div className={`pane-scroll ${editing ? "is-editing" : ""}`}>
        {isLoading && (
          <>
            <Skeleton height={72} />
            <div style={{ height: 12 }} />
            <Skeleton height={72} />
          </>
        )}
        {isError && (
          <EmptyState
            title="Transcript unavailable"
            body={error instanceof Error ? error.message : "Retry after the API is reachable."}
            action={<Button onClick={() => refetch()}>Retry</Button>}
          />
        )}
        {!isLoading && !segments.length && (
          <EmptyState title="No transcript yet" body="Upload or paste a transcript to populate this pane." />
        )}
        {find.trim().length >= 2 && search.data?.matches.length === 0 && (
          <p className="muted">No transcript hits for “{find}”.</p>
        )}
        {segments
          .filter((s) => (speaker === "all" ? true : String(s.speaker_id) === speaker))
          .filter((s) => (useServerFilter ? matchIds.has(s.id) : true))
          .map((s) => (
            <div key={s.id} data-seg={s.id}>
              <UtteranceBlock
                segment={s}
                active={s.id === activeId}
                editing={editing}
                nameOverride={names[s.speaker_id]}
                currentTime={currentTime}
                onSeek={seekTo}
                onRename={(name) => setNames((prev) => ({ ...prev, [s.speaker_id]: name }))}
                onChangeText={(text) =>
                  pushHist(draft.map((row) => (row.id === s.id ? { ...row, text } : row)))
                }
              />
            </div>
          ))}
      </div>
    </div>
  );
}
