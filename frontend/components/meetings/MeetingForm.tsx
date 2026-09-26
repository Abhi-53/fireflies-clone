"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateMeeting } from "@/hooks/api";
import { uploadTranscriptFile } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";

export function MeetingForm() {
  const router = useRouter();
  const { pushToast } = useToast();
  const create = useCreateMeeting();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [participants, setParticipants] = useState("Sarah Chen");
  const [transcript, setTranscript] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const meeting = await create.mutateAsync({
        title: title.trim(),
        meeting_date: new Date(date).toISOString(),
        participants: participants
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        transcript_text: transcript.trim() || undefined,
      });
      if (file) {
        await uploadTranscriptFile(meeting.id, file);
      }
      pushToast({ variant: "success", title: "Meeting created" });
      router.push(`/meetings/${meeting.id}`);
    } catch (err) {
      pushToast({
        variant: "error",
        title: "Could not create meeting",
        body: err instanceof Error ? err.message : "Check the API server.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="page" id="new-meeting-view" onSubmit={submit} style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div>
          <h1>Upload meeting</h1>
          <p>Create a recap from a title, attendees, and optional transcript paste or file.</p>
        </div>
      </div>
      {/* Placeholder: Real-time bot that joins live calls */}
      <div
        style={{
          marginBottom: 20,
          padding: "14px 16px",
          background: "rgba(110, 68, 255, 0.08)",
          border: "1px dashed rgba(110, 68, 255, 0.35)",
          borderRadius: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <strong style={{ color: "#fff", fontSize: 13.5 }}>Real-time bot that joins live calls (Zoom, Google Meet, Teams)</strong>
          <span className="subbar-pill subbar-pill--ghost" style={{ height: 22, fontSize: 11, background: "rgba(255,255,255,0.08)" }}>
            Coming Soon
          </span>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
          Auto-invite Fred or the MeetFlow assistant to scheduled calendar meetings to record and transcribe conversations live.
        </p>
      </div>

      <label className="field-label">Title</label>
      <input className="mf-input" required value={title} onChange={(e) => setTitle(e.target.value)} />
      <label className="field-label">Date & time</label>
      <input className="mf-input" type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} />
      <label className="field-label">Participants (comma-separated)</label>
      <input className="mf-input" value={participants} onChange={(e) => setParticipants(e.target.value)} />
      <label className="field-label">Paste transcript</label>
      <textarea
        className="mf-textarea"
        placeholder="[00:00:00] Alex Rivera: Let's get started..."
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
      />
      <label className="field-label">Or upload a transcript file</label>
      <input
        className="mf-input"
        type="file"
        accept=".txt,.vtt,.srt,.json"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      {/* Placeholder: Actual speech-to-text transcription */}
      <div
        style={{
          marginTop: 12,
          padding: "12px 14px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px dashed rgba(255, 255, 255, 0.12)",
          borderRadius: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: "#d1d5db", fontSize: 13, fontWeight: 500 }}>
            Actual speech-to-text audio transcription (Whisper AI)
          </span>
          <span className="subbar-pill subbar-pill--ghost" style={{ height: 20, fontSize: 10.5, background: "rgba(255,255,255,0.06)" }}>
            Coming Soon
          </span>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 12 }}>
          Live audio file processing via Whisper speech-to-text is coming soon. In the meantime, upload or paste pre-transcribed text above.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <Button type="submit" variant="primary" disabled={busy || !title.trim()}>
          {busy ? "Creating…" : "Create meeting"}
        </Button>
        <Button variant="outline" onClick={() => router.push("/meetings")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
