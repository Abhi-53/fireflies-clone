"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Download,
  Link as LinkIcon,
  List,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Search,
  Send,
  Share2,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useMeeting, useRegenerateSummary, useUpdateMeeting } from "@/hooks/api";
import { getExportUrl } from "@/lib/api-client";
import { PlayerSyncProvider } from "@/context/PlayerSyncContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dropdown, MenuDivider, MenuItem } from "@/components/ui/Dropdown";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { MeetingInfoModal } from "@/components/meetings/MeetingInfoModal";
import { ShareModal } from "@/components/meetings/ShareModal";
import { SummaryPane } from "@/components/summary/SummaryPane";
import { TranscriptPane } from "@/components/transcript/TranscriptPane";
import { MediaPlayer } from "@/components/transcript/MediaPlayer";
import { useToast } from "@/context/ToastContext";
import { cx } from "@/lib/format";

function ToolsRail({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  const items = [
    { id: "search", icon: Search, label: "Smart Search" },
    { id: "index", icon: List, label: "Summary Index" },
    { id: "soundbites", icon: Wand2, label: "Soundbites" },
    { id: "comments", icon: MessageSquare, label: "Comments" },
    { id: "bookmarks", icon: Bookmark, label: "Bookmarks" },
  ];
  return (
    <nav className="tools-rail" aria-label="Workspace tools">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.id}
            variant="icon"
            className={active === item.id ? "is-active" : undefined}
            aria-label={item.label}
            title={item.label}
            onClick={() => onChange(item.id)}
          >
            <Icon size={16} />
          </Button>
        );
      })}
    </nav>
  );
}

function MeetingDetailInner({ meetingId }: { meetingId: number }) {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch } = useMeeting(meetingId);
  const update = useUpdateMeeting(meetingId);
  const regen = useRegenerateSummary(meetingId);
  const { pushToast } = useToast();
  const [tool, setTool] = useState("index");
  const [mobilePane, setMobilePane] = useState<"summary" | "transcript">("summary");
  const [infoOpen, setInfoOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [keyword, setKeyword] = useState<string | null>(null);

  React.useEffect(() => {
    if (data?.title) setTitle(data.title);
  }, [data?.title]);

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton height={48} />
        <div style={{ height: 16 }} />
        <Skeleton height={240} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Meeting not found"
        body={error instanceof Error ? error.message : "This recap may have been deleted."}
        action={
          <Button variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="notepad" id="meeting-detail-view" data-meeting-id={meetingId}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <div className="detail-header">
          <div className="detail-header__left">
            <Button variant="ghost" size="sm" onClick={() => router.push("/meetings")}>
              ← Meetings
            </Button>
            <div className="detail-title-wrap">
              <input
                className="detail-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title.trim() && title.trim() !== data.title) {
                    update.mutate({ title: title.trim() });
                  }
                }}
                aria-label="Meeting title"
              />
              <Pencil size={13} className="detail-title-pencil" />
            </div>
            <Badge variant="completed">Completed</Badge>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => pushToast({ variant: "success", title: "AI Skills queued" })}
            >
              <Sparkles size={14} />
              AI Skills
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
              <Share2 size={14} />
              Share
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await navigator.clipboard.writeText(`${window.location.origin}/meetings/${meetingId}`);
                pushToast({ variant: "success", title: "Link copied to clipboard" });
              }}
            >
              <LinkIcon size={14} />
              Copy Link
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pushToast({ variant: "success", title: "Pushed to Slack / Notion" })}
            >
              <Send size={14} />
            </Button>
            <Dropdown
              trigger={
                <Button variant="icon" aria-label="More">
                  <MoreHorizontal size={16} />
                </Button>
              }
            >
              <MenuItem
                onClick={() =>
                  regen.mutate(undefined, {
                    onSuccess: () => pushToast({ variant: "success", title: "Notes regenerated" }),
                    onError: (e) =>
                      pushToast({ variant: "error", title: "Failed to regenerate summary", body: e.message }),
                  })
                }
              >
                Regenerate Notes
              </MenuItem>
              <MenuItem onClick={() => setInfoOpen(true)}>Meeting Info</MenuItem>
              <MenuItem
                icon={<Download size={14} />}
                onClick={() => window.open(getExportUrl(meetingId, "md"), "_blank")}
              >
                Export Markdown (.md)
              </MenuItem>
              <MenuItem
                icon={<Download size={14} />}
                onClick={() => window.open(getExportUrl(meetingId, "txt"), "_blank")}
              >
                Export Plain Text (.txt)
              </MenuItem>
              <MenuItem
                icon={<Download size={14} />}
                onClick={() => window.open(getExportUrl(meetingId, "json"), "_blank")}
              >
                Export JSON (.json)
              </MenuItem>
              <MenuDivider />
              <MenuItem onClick={() => pushToast({ variant: "warning", title: "Language picker coming in settings" })}>
                Change Language
              </MenuItem>
            </Dropdown>
          </div>
        </div>

        <div className="mobile-tabs">
          <div className="mf-pills">
            <button
              type="button"
              className={cx("mf-pill", mobilePane === "summary" && "is-active")}
              onClick={() => setMobilePane("summary")}
            >
              Summary
            </button>
            <button
              type="button"
              className={cx("mf-pill", mobilePane === "transcript" && "is-active")}
              onClick={() => setMobilePane("transcript")}
            >
              Transcript
            </button>
          </div>
        </div>

        <div className="notepad" style={{ flex: 1, minHeight: 0 }}>
          <ToolsRail
            active={tool}
            onChange={(id) => {
              setTool(id);
              if (id === "search") setMobilePane("transcript");
              if (id === "index") setMobilePane("summary");
              if (id === "soundbites") {
                pushToast({ variant: "success", title: "Soundbites", body: "Hover an utterance and choose Clip." });
              }
            }}
          />
          <section className={cx("notepad-left", mobilePane !== "summary" && "is-hidden")}>
            <SummaryPane meetingId={meetingId} keywordFilter={keyword} onKeyword={setKeyword} />
          </section>
          <section className={cx("notepad-right", mobilePane !== "transcript" && "is-hidden")}>
            <MediaPlayer
              meetingId={meetingId}
              mediaUrl={data.media_url}
              durationSeconds={data.duration_seconds}
              stickyMobile
            />
            <TranscriptPane meetingId={meetingId} keywordFilter={keyword} focusFind={tool === "search"} />
          </section>
          {tool === "comments" && (
            <aside className="comments-drawer">
              <div style={{ padding: 16, borderBottom: "1px solid var(--grey-200)", fontWeight: 600 }}>Comments</div>
              <div className="pane-scroll">
                <p className="muted">No comments yet. Hover an utterance and add a timestamped note.</p>
              </div>
            </aside>
          )}
          {tool === "bookmarks" && (
            <aside className="comments-drawer">
              <div style={{ padding: 16, borderBottom: "1px solid var(--grey-200)", fontWeight: 600 }}>Bookmarks</div>
              <div className="pane-scroll">
                <p className="muted">Bookmark moments from the transcript hover toolbar as you listen.</p>
              </div>
            </aside>
          )}
        </div>
      </div>

      <MeetingInfoModal meeting={data} open={infoOpen} onClose={() => setInfoOpen(false)} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} meetingId={meetingId} title={data.title} />
    </div>
  );
}

export function MeetingDetailView({ meetingId }: { meetingId: number }) {
  return (
    <PlayerSyncProvider>
      <MeetingDetailInner meetingId={meetingId} />
    </PlayerSyncProvider>
  );
}
