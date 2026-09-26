"use client";

import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Video,
} from "lucide-react";
import { useDeleteMeeting, useMeetings } from "@/hooks/api";
import { updateMeeting } from "@/lib/api-client";
import { deriveCaptureSource, deriveChannel, isHostedByCurrentUser, isSharedWithCurrentUser } from "@/lib/workspace";
import type { MeetingListItem } from "@/types/api";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/EmptyState";
import { Modal, ModalHeader } from "@/components/ui/Modal";
import { useToast } from "@/context/ToastContext";
import { BulkActionBar } from "./BulkActionBar";
import { DEFAULT_FILTERS, dateRangeFromPreset, type LibraryFilters } from "./FilterToolbar";
import { MeetingInfoModal } from "./MeetingInfoModal";
import { MeetingRow } from "./MeetingRow";
import { ShareModal } from "./ShareModal";
import { cx } from "@/lib/format";

function matchesDuration(seconds: number, bucket: LibraryFilters["duration"]) {
  const m = seconds / 60;
  if (!bucket) return true;
  if (bucket === "lt15") return m < 15;
  if (bucket === "15-30") return m >= 15 && m <= 30;
  if (bucket === "30-60") return m > 30 && m <= 60;
  return m > 60;
}

export function MeetingsLibrary({
  channelId,
}: {
  channelId?: string;
  title?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "my";
  const [filters, setFilters] = useState<LibraryFilters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<number[]>([]);
  const [info, setInfo] = useState<MeetingListItem | null>(null);
  const [shareId, setShareId] = useState<number | null>(null);
  const [rename, setRename] = useState<MeetingListItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmIds, setConfirmIds] = useState<number[] | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const range = dateRangeFromPreset(filters.datePreset);
  const { data, isLoading, isError, error, refetch } = useMeetings({
    search: filters.search || undefined,
    participant: filters.participant || undefined,
    date_from: range.date_from,
    date_to: range.date_to,
    sort: "recent",
    limit: 50,
  });
  const del = useDeleteMeeting();

  const items = useMemo(() => {
    let list = data?.items ?? [];
    const effectiveTab = channelId ? "all" : tab;
    if (effectiveTab === "my") list = list.filter((m) => isHostedByCurrentUser(m.participants));
    if (effectiveTab === "shared") list = list.filter((m) => isSharedWithCurrentUser(m.participants));
    if (filters.hostedByMe) list = list.filter((m) => isHostedByCurrentUser(m.participants));
    if (filters.sharedWithMe) list = list.filter((m) => isSharedWithCurrentUser(m.participants));
    if (channelId && channelId !== "all" && channelId !== "my") {
      list = list.filter((m) => deriveChannel(m.title, m.id) === channelId);
    }
    if (channelId === "voice-agents") {
      list = list.filter((m) => deriveCaptureSource(m.id, m.media_url) === "voice-agent");
    }
    if (channelId === "uploads") {
      list = list.filter((m) => deriveCaptureSource(m.id, m.media_url) === "upload");
    }
    list = list.filter((m) => matchesDuration(m.duration_seconds, filters.duration));
    if (filters.capture.length) {
      list = list.filter((m) => filters.capture.includes(deriveCaptureSource(m.id, m.media_url)));
    }
    return list;
  }, [data, tab, filters, channelId]);

  const toggle = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runDelete = async (ids: number[]) => {
    try {
      for (const id of ids) await del.mutateAsync(id);
      pushToast({ variant: "success", title: ids.length > 1 ? "Meetings deleted" : "Meeting deleted" });
      setSelected([]);
      setConfirmIds(null);
    } catch (e) {
      pushToast({ variant: "error", title: "Failed to delete", body: e instanceof Error ? e.message : "" });
    }
  };

  const isHostedActive = filters.hostedByMe;
  const isSharedActive = filters.sharedWithMe;

  return (
    <div className="meetings-workspace" id="meetings-library-view">
      {/* Sub-toolbar matching screenshot */}
      <div className="meetings-subbar">
        <div className="meetings-subbar__left">
          <button
            type="button"
            className={cx("subbar-pill", isHostedActive && "is-active")}
            onClick={() => setFilters((f) => ({ ...f, hostedByMe: !f.hostedByMe }))}
          >
            Hosted by me
          </button>

          <button
            type="button"
            className={cx("subbar-pill", isSharedActive && "is-active")}
            onClick={() => setFilters((f) => ({ ...f, sharedWithMe: !f.sharedWithMe }))}
          >
            Shared with me
          </button>

          <button
            type="button"
            className={cx("subbar-pill", filterDrawerOpen && "is-active")}
            onClick={() => setFilterDrawerOpen((v) => !v)}
          >
            <SlidersHorizontal size={13} />
            <span>Filters</span>
          </button>
        </div>

        <div className="meetings-subbar__right">
          <button
            type="button"
            className="subbar-icon-btn"
            title="Search meetings"
            aria-label="Search meetings"
            onClick={() => {
              const el = document.querySelector<HTMLInputElement>(".app-navbar__search-box");
              if (el) el.click();
            }}
          >
            <Search size={15} />
          </button>
        </div>
      </div>

      {/* Filter Drawer */}
      {filterDrawerOpen && (
        <div className="meetings-filter-drawer">
          <div className="filter-drawer-group">
            <span className="filter-drawer-label">Duration</span>
            <div className="filter-drawer-pills">
              {(
                [
                  { id: "", label: "All lengths" },
                  { id: "lt15", label: "< 15 min" },
                  { id: "15-30", label: "15 - 30 min" },
                  { id: "30-60", label: "30 - 60 min" },
                  { id: "gt60", label: "> 60 min" },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={cx("filter-drawer-pill", filters.duration === d.id && "is-active")}
                  onClick={() => setFilters((f) => ({ ...f, duration: d.id }))}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-drawer-group">
            <span className="filter-drawer-label">Date</span>
            <div className="filter-drawer-pills">
              {(
                [
                  { id: "any", label: "Any time" },
                  { id: "today", label: "Today" },
                  { id: "7d", label: "Past 7 days" },
                  { id: "30d", label: "Past 30 days" },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={cx("filter-drawer-pill", filters.datePreset === preset.id && "is-active")}
                  onClick={() => setFilters((f) => ({ ...f, datePreset: preset.id }))}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="filter-drawer-reset"
            onClick={() => setFilters(DEFAULT_FILTERS)}
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="meetings-table" style={{ padding: 16, display: "grid", gap: 12 }}>
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="meetings-error-box">
          <h3>Couldn’t load meetings</h3>
          <p>{error instanceof Error ? error.message : "Ensure the backend server is reachable."}</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Empty State matching Fireflies Reference Screenshot */}
      {!isLoading && !isError && items.length === 0 && (
        <div className="fireflies-empty-state">
          {/* 3 stacked stylized speech bubble cards */}
          <div className="speech-bubbles-preview">
            <div className="speech-bubble-item">
              <div className="bubble-avatar bubble-avatar--k">K</div>
              <div className="bubble-skeleton-lines">
                <div className="skeleton-bar skeleton-bar--long" />
                <div className="skeleton-bar skeleton-bar--short" />
              </div>
            </div>

            <div className="speech-bubble-item">
              <div className="bubble-avatar bubble-avatar--a">A</div>
              <div className="bubble-skeleton-lines">
                <div className="skeleton-bar skeleton-bar--medium" />
                <div className="skeleton-bar skeleton-bar--short" />
              </div>
            </div>

            <div className="speech-bubble-item">
              <div className="bubble-avatar bubble-avatar--r">R</div>
              <div className="bubble-skeleton-lines">
                <div className="skeleton-bar skeleton-bar--long" />
                <div className="skeleton-bar skeleton-bar--short" />
              </div>
            </div>
          </div>

          <h2 className="empty-state-title">
            Looks like you haven&apos;t recorded a meeting yet
          </h2>
          <p className="empty-state-desc">
            Once you record your first meeting with Fireflies, it&apos;ll show up right here.
          </p>

          <button
            type="button"
            className="btn-capture-cta"
            onClick={() => router.push("/meetings/new")}
          >
            <Plus size={16} />
            <span>Capture</span>
          </button>
        </div>
      )}

      {/* Populated Meetings Table when meetings exist */}
      {!isLoading && items.length > 0 && (
        <div className="meetings-table-container">
          <div className="meetings-table" role="table">
            <div className="meetings-thead">
              <span />
              <span>Meeting</span>
              <span>Date & time</span>
              <span>Duration</span>
              <span>Attendees</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>
            {items.map((m) => (
              <MeetingRow
                key={m.id}
                meeting={m}
                selected={selected.includes(m.id)}
                onToggle={() => toggle(m.id)}
                onOpen={() => router.push(`/meetings/${m.id}`)}
                onDetails={() => setInfo(m)}
                onShare={() => setShareId(m.id)}
                onRename={() => {
                  setRename(m);
                  setRenameValue(m.title);
                }}
                onDelete={() => setConfirmIds([m.id])}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        count={selected.length}
        onSelectAll={() => setSelected(items.map((m) => m.id))}
        onClear={() => setSelected([])}
        onMove={() =>
          pushToast({ variant: "success", title: "Moved to channel", body: "Selected recaps were tagged to Engineering." })
        }
        onDelete={() => setConfirmIds(selected)}
      />

      <MeetingInfoModal meeting={info} open={!!info} onClose={() => setInfo(null)} />
      <ShareModal
        open={shareId !== null}
        meetingId={shareId}
        title={items.find((m) => m.id === shareId)?.title}
        onClose={() => setShareId(null)}
      />

      <Modal open={!!rename} onClose={() => setRename(null)}>
        <ModalHeader title="Rename meeting" onClose={() => setRename(null)} />
        <div className="mf-modal__body">
          <input className="mf-input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
        </div>
        <div className="mf-modal__footer">
          <span />
          <Button
            variant="primary"
            disabled={!renameValue.trim()}
            onClick={async () => {
              if (!rename) return;
              await updateMeeting(rename.id, { title: renameValue.trim() });
              await queryClient.invalidateQueries({ queryKey: ["meetings"] });
              await queryClient.invalidateQueries({ queryKey: ["meeting", rename.id] });
              pushToast({ variant: "success", title: "Meeting renamed" });
              setRename(null);
            }}
          >
            Save
          </Button>
        </div>
      </Modal>

      <Modal open={!!confirmIds} onClose={() => setConfirmIds(null)}>
        <ModalHeader title="Delete meetings?" onClose={() => setConfirmIds(null)} />
        <div className="mf-modal__body">
          <p>This permanently removes recaps, transcripts, and action items for the selected meetings.</p>
        </div>
        <div className="mf-modal__footer">
          <Button variant="ghost" onClick={() => setConfirmIds(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => confirmIds && runDelete(confirmIds)}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
