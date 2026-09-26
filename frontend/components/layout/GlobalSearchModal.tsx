"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalHeader } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { useGlobalSearch } from "@/hooks/api";
import { formatSecondsToTime } from "@/lib/format";

export function GlobalSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const { data, isFetching, isError } = useGlobalSearch(q);
  const router = useRouter();

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const go = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="Search MeetFlow" onClose={onClose} id="global-search-title" />
      <div className="mf-modal__body global-search-modal">
        <SearchInput value={q} onChange={setQ} placeholder="Search meetings, transcripts, or ask AI..." />
        <div style={{ marginTop: 16 }}>
          {q.trim().length < 2 && (
            <p className="muted">Type at least 2 characters, or ask a natural-language question about a recap.</p>
          )}
          {isFetching && <p className="muted">Searching…</p>}
          {isError && <p className="muted">Search failed. Confirm the API is running on port 8000.</p>}
          {data && !data.meetings.length && !data.transcripts.length && !data.summaries.length && q.trim().length >= 2 && (
            <p className="muted">No matches for “{data.query}”.</p>
          )}
          {data?.meetings.map((m) => (
            <button key={`m-${m.id}`} className="search-hit" onClick={() => go(`/meetings/${m.id}`)}>
              <div className="search-hit__head">
                <span className="search-hit__badge search-hit__badge--meeting">Meeting</span>
                <strong>{m.title}</strong>
              </div>
              <span>Matched in {m.match_field}</span>
            </button>
          ))}
          {data?.transcripts.map((t) => (
            <button
              key={`t-${t.segment_id}`}
              className="search-hit"
              onClick={() => go(`/meetings/${t.meeting_id}`)}
            >
              <div className="search-hit__head">
                <span className="search-hit__badge search-hit__badge--transcript">Transcript</span>
                <strong>{t.meeting_title}</strong>
                <span className="search-hit__time">{formatSecondsToTime(t.start_time_seconds)}</span>
              </div>
              <span>
                {t.speaker_name}: “{t.text_snippet}”
              </span>
            </button>
          ))}
          {data?.summaries.map((s) => (
            <button key={`s-${s.meeting_id}`} className="search-hit" onClick={() => go(`/meetings/${s.meeting_id}`)}>
              <div className="search-hit__head">
                <span className="search-hit__badge search-hit__badge--summary">AI Summary</span>
                <strong>{s.meeting_title}</strong>
              </div>
              <span>{s.overview_snippet}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
