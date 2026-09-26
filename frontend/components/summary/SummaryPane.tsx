"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ThumbsDown, ThumbsUp } from "lucide-react";
import { useActionItems, useCreateActionItem, useRegenerateSummary, useSummary, useToggleActionItem } from "@/hooks/api";
import { usePlayerSync } from "@/context/PlayerSyncContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { formatSecondsToTime, cx } from "@/lib/format";
import { useToast } from "@/context/ToastContext";

const TEMPLATES = [
  "General Summary",
  "Team Meeting",
  "1:1 Meeting",
  "Sales Call (BANT)",
  "Interview Evaluation",
  "Standup",
];

function keywordsFromOverview(text: string): string[] {
  const stop = new Set(["the", "and", "for", "with", "that", "this", "from", "were", "was", "are", "their", "about"]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 5 && !stop.has(w));
  return Array.from(new Set(words)).slice(0, 8);
}

function bulletsFromOverview(text: string): string[] {
  return text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 24);
}

export function SummaryPane({
  meetingId,
  keywordFilter,
  onKeyword,
}: {
  meetingId: number;
  keywordFilter?: string | null;
  onKeyword?: (kw: string | null) => void;
}) {
  const { data, isLoading, isError, refetch } = useSummary(meetingId);
  const regen = useRegenerateSummary(meetingId);
  const actions = useActionItems(meetingId);
  const toggle = useToggleActionItem(meetingId);
  const create = useCreateActionItem(meetingId);
  const { seekTo } = usePlayerSync();
  const { pushToast } = useToast();
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>({});
  const [openNotes, setOpenNotes] = useState<Record<number, boolean>>({});
  const [newItem, setNewItem] = useState("");
  const [condensed, setCondensed] = useState(false);
  const [customerVoice, setCustomerVoice] = useState(false);

  const overview = data?.summary?.overview_text || "";
  const keywords = useMemo(() => keywordsFromOverview(overview), [overview]);
  const bullets = useMemo(() => bulletsFromOverview(overview), [overview]);

  if (isLoading) {
    return (
      <div className="pane-scroll">
        <Skeleton height={28} width={180} />
        <div style={{ height: 16 }} />
        <Skeleton height={80} />
        <div style={{ height: 16 }} />
        <Skeleton height={160} />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Summary failed to load"
        body="Confirm the backend is running, then retry."
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );
  }

  const displayOverview = condensed
    ? bullets.slice(0, 2).join(" ")
    : customerVoice
      ? overview.replace(/\bwe\b/gi, "the customer").replace(/\bour\b/gi, "their")
      : overview;

  return (
    <div className="pane-scroll">
      <div className="summary-toolbar">
        <select
          className="mf-input mf-input--compact"
          style={{ maxWidth: 220 }}
          value={template}
          onChange={(e) => {
            setTemplate(e.target.value);
            pushToast({ variant: "success", title: `Template: ${e.target.value}` });
          }}
        >
          {TEMPLATES.map((t) => (
            <option key={t}>{t}</option>
          ))}
          <option>+ Custom Template</option>
        </select>
        <Badge variant="ai">✨ AI generated</Badge>
      </div>
      <div className="refine-pills">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setCondensed(true);
            setCustomerVoice(false);
            pushToast({ variant: "success", title: "Condensed to executive bullets" });
          }}
        >
          📝 Condense
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            regen.mutate(undefined, {
              onSuccess: () => {
                setCondensed(false);
                pushToast({ variant: "success", title: "Summary expanded" });
              },
            })
          }
        >
          📖 Expand & Elaborate
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setCustomerVoice(true);
            setCondensed(false);
            pushToast({ variant: "success", title: "Rewritten in customer voice" });
          }}
        >
          🎧 Customer Voice
        </Button>
      </div>

      <h2 className="section-h">Meeting keywords</h2>
      <div className="keywords">
        {keywords.map((k) => (
          <button
            key={k}
            className={cx("keyword", keywordFilter === k && "is-active")}
            onClick={() => onKeyword?.(k === keywordFilter ? null : k)}
          >
            #{k}
          </button>
        ))}
        {!keywords.length && <span className="muted">No keywords extracted.</span>}
      </div>
      {keywordFilter ? (
        <p className="muted">Filtering transcript for “{keywordFilter}”. Click the chip again to clear.</p>
      ) : null}

      <h2 className="section-h">Meeting overview</h2>
      <p className="overview">{displayOverview || "No overview yet. Regenerate notes after a transcript is available."}</p>

      <h2 className="section-h">Structured meeting notes</h2>
      {!bullets.length && <p className="muted">Notes will appear once a summary is generated.</p>}
      {bullets.map((b, i) => {
        const open = openNotes[i];
        if (keywordFilter && !b.toLowerCase().includes(keywordFilter) && !overview.toLowerCase().includes(keywordFilter)) {
          return null;
        }
        return (
          <div key={i} className="note-bullet">
            <div className="note-bullet__row">
              <button
                type="button"
                className="mf-btn mf-btn--icon"
                aria-label="Toggle sub-bullets"
                onClick={() => setOpenNotes((p) => ({ ...p, [i]: !open }))}
              >
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <p>{b}</p>
            </div>
            {open ? (
              <p className="note-bullet__sub">
                Expanded context for {template}: supporting discussion and decisions tied to this point.
              </p>
            ) : null}
          </div>
        );
      })}

      <h2 className="section-h">Time-stamped notes / chapters</h2>
      {(data?.topics ?? []).length === 0 && <p className="muted">No chapters for this meeting.</p>}
      {(data?.topics ?? []).map((topic) => {
        const open = openChapters[topic.id];
        const text = topic.title;
        if (keywordFilter && !text.toLowerCase().includes(keywordFilter)) {
          return null;
        }
        return (
          <div key={topic.id} className="chapter">
            <button
              type="button"
              className="mf-btn mf-btn--icon"
              onClick={() => setOpenChapters((p) => ({ ...p, [topic.id]: !open }))}
              aria-label="Toggle details"
            >
              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <div>
              {typeof topic.start_time_seconds === "number" ? (
                <button type="button" className="time" onClick={() => seekTo(topic.start_time_seconds || 0)}>
                  {formatSecondsToTime(topic.start_time_seconds)}
                </button>
              ) : null}
              <div style={{ fontWeight: 600, fontSize: 14 }}>{topic.title}</div>
              {open ? (
                <p className="muted">Deeper notes for this chapter expand from the selected template ({template}).</p>
              ) : null}
            </div>
          </div>
        );
      })}

      <h2 className="section-h">Action items</h2>
      {(actions.data ?? []).map((item) => (
        <div key={item.id} className={`action-row ${item.is_completed ? "is-done" : ""}`}>
          <input
            type="checkbox"
            className="mf-checkbox"
            checked={item.is_completed}
            onChange={() => toggle.mutate({ itemId: item.id, isCompleted: !item.is_completed })}
          />
          <div style={{ flex: 1 }}>
            <div className="action-text">{item.text}</div>
            {item.due_date ? <div className="muted">Due {item.due_date}</div> : null}
          </div>
          {item.assignee ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Avatar name={item.assignee} size="xs" />
              <span className="muted">{item.assignee}</span>
            </span>
          ) : (
            <span className="muted">Unassigned</span>
          )}
        </div>
      ))}
      {!actions.data?.length && <p className="muted">No action items were extracted for this meeting.</p>}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          className="mf-input mf-input--compact"
          placeholder="Add an action item"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={!newItem.trim()}
          onClick={() => {
            create.mutate({ text: newItem.trim() });
            setNewItem("");
          }}
        >
          Add
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        style={{ marginTop: 8 }}
        onClick={() => pushToast({ variant: "success", title: "Queued for Asana / Linear" })}
      >
        Add to Task Manager
      </Button>

      <div className="feedback-bar">
        Was this summary accurate?
        <Button
          variant="icon"
          aria-label="Yes"
          onClick={() => pushToast({ variant: "success", title: "Thanks for the feedback" })}
        >
          <ThumbsUp size={16} />
        </Button>
        <Button
          variant="icon"
          aria-label="No"
          onClick={() => pushToast({ variant: "warning", title: "We’ll improve this template" })}
        >
          <ThumbsDown size={16} />
        </Button>
      </div>
    </div>
  );
}
