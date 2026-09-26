"use client";

import React, { useState } from "react";
import { Filter, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/SearchInput";
import { cx } from "@/lib/format";

export type DurationBucket = "" | "lt15" | "15-30" | "30-60" | "gt60";
export type DatePreset = "any" | "today" | "7d" | "30d";
export type CaptureFilter = "voice-agent" | "desktop" | "extension" | "recording" | "upload";

const CAPTURES: Array<{ id: CaptureFilter; label: string }> = [
  { id: "voice-agent", label: "Notetaker Bot / Voice Agent" },
  { id: "desktop", label: "Desktop App" },
  { id: "extension", label: "Chrome Extension" },
  { id: "recording", label: "Audio Recording" },
  { id: "upload", label: "Upload" },
];

export interface LibraryFilters {
  search: string;
  hostedByMe: boolean;
  sharedWithMe: boolean;
  datePreset: DatePreset;
  duration: DurationBucket;
  capture: CaptureFilter[];
  participant: string;
}

export const DEFAULT_FILTERS: LibraryFilters = {
  search: "",
  hostedByMe: false,
  sharedWithMe: false,
  datePreset: "any",
  duration: "",
  capture: [],
  participant: "",
};

export function dateRangeFromPreset(preset: DatePreset): { date_from?: string; date_to?: string } {
  const now = new Date();
  if (preset === "any") return {};
  if (preset === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { date_from: start.toISOString(), date_to: now.toISOString() };
  }
  const days = preset === "7d" ? 7 : 30;
  const start = new Date(now.getTime() - days * 86400000);
  return { date_from: start.toISOString(), date_to: now.toISOString() };
}

export function FilterToolbar({
  filters,
  onChange,
  onUpload,
  onAddNotetaker,
}: {
  filters: LibraryFilters;
  onChange: (next: LibraryFilters) => void;
  onUpload: () => void;
  onAddNotetaker: () => void;
}) {
  const [open, setOpen] = useState(false);
  const activeCount = [
    filters.datePreset !== "any",
    filters.duration !== "",
    filters.capture.length > 0,
    filters.participant.trim().length > 0,
  ].filter(Boolean).length;

  const toggleCapture = (id: CaptureFilter) => {
    const next = filters.capture.includes(id)
      ? filters.capture.filter((c) => c !== id)
      : [...filters.capture, id];
    onChange({ ...filters, capture: next });
  };

  return (
    <div className="filter-row">
      <div style={{ width: 260 }}>
        <SearchInput
          compact
          value={filters.search}
          onChange={(search) => onChange({ ...filters, search })}
          placeholder="Search this channel..."
        />
      </div>
      <button
        type="button"
        className={cx("quick-toggle", filters.hostedByMe && "is-active")}
        onClick={() => onChange({ ...filters, hostedByMe: !filters.hostedByMe, sharedWithMe: false })}
      >
        Hosted by me
      </button>
      <button
        type="button"
        className={cx("quick-toggle", filters.sharedWithMe && "is-active")}
        onClick={() => onChange({ ...filters, sharedWithMe: !filters.sharedWithMe, hostedByMe: false })}
      >
        Shared with me
      </button>
      <div style={{ position: "relative" }}>
        <Button variant="ghost" onClick={() => setOpen((v) => !v)}>
          <Filter size={14} />
          Filters
          {activeCount ? <span className="mf-tab-count">{activeCount}</span> : null}
        </Button>
        {open && (
          <div className="popover" style={{ top: "110%", left: 0 }}>
            <h4>Advanced filters</h4>
            <label className="field-label">Hosted by / participants</label>
            <input
              className="mf-input mf-input--compact"
              value={filters.participant}
              placeholder="Name"
              onChange={(e) => onChange({ ...filters, participant: e.target.value })}
            />
            <label className="field-label">Date range</label>
            <select
              className="mf-input mf-input--compact"
              value={filters.datePreset}
              onChange={(e) => onChange({ ...filters, datePreset: e.target.value as DatePreset })}
            >
              <option value="any">Any time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <label className="field-label">Duration</label>
            <select
              className="mf-input mf-input--compact"
              value={filters.duration}
              onChange={(e) => onChange({ ...filters, duration: e.target.value as DurationBucket })}
            >
              <option value="">Any</option>
              <option value="lt15">&lt; 15m</option>
              <option value="15-30">15–30m</option>
              <option value="30-60">30–60m</option>
              <option value="gt60">&gt; 60m</option>
            </select>
            <label className="field-label">Capture source</label>
            <div className="checkbox-stack">
              {CAPTURES.map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    className="mf-checkbox"
                    checked={filters.capture.includes(c.id)}
                    onChange={() => toggleCapture(c.id)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange({
                    ...filters,
                    datePreset: "any",
                    duration: "",
                    capture: [],
                    participant: "",
                  })
                }
              >
                Reset
              </Button>
              <Button variant="primary" size="sm" onClick={() => setOpen(false)}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="filter-row__spacer" />
      <Button variant="outline" onClick={onUpload}>
        <Upload size={14} />
        Upload Audio/Video
      </Button>
      <Button variant="primary" onClick={onAddNotetaker}>
        Add Notetaker
      </Button>
    </div>
  );
}
