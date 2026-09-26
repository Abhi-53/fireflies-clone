export const CURRENT_USER = {
  name: "Abhi",
  email: "abhi@meetflow.ai",
  plan: "Free",
  credits: 3,
  workspace: "MeetFlow HQ",
};

export type CaptureSource = "voice-agent" | "extension" | "desktop" | "recording" | "upload";

export type ChannelId =
  | "my"
  | "all"
  | "voice-agents"
  | "uploads"
  | "engineering"
  | "sales-calls"
  | "leadership";

export const CHANNELS: Array<{
  id: ChannelId;
  label: string;
  kind: "builtin" | "public" | "private";
}> = [
  { id: "my", label: "My Meetings", kind: "builtin" },
  { id: "all", label: "All Meetings", kind: "builtin" },
  { id: "voice-agents", label: "Voice Agents", kind: "builtin" },
  { id: "uploads", label: "Uploads", kind: "builtin" },
  { id: "engineering", label: "engineering", kind: "public" },
  { id: "sales-calls", label: "sales-calls", kind: "public" },
  { id: "leadership", label: "leadership", kind: "private" },
];

export function channelLabel(id: ChannelId): string {
  const ch = CHANNELS.find((c) => c.id === id);
  if (!ch) return id;
  if (ch.kind === "public") return `#${ch.label}`;
  if (ch.kind === "private") return `🔒 ${ch.label}`;
  return ch.label;
}

export function deriveChannel(title: string, meetingId: number): ChannelId {
  const t = title.toLowerCase();
  if (t.includes("1-on-1") || t.includes("1:1") || t.includes("1 on 1")) return "my";
  if (t.includes("executive") || t.includes("strategy") || t.includes("board")) return "leadership";
  if (t.includes("sales") || t.includes("bant") || t.includes("pipeline")) return "sales-calls";
  if (t.includes("standup") || t.includes("engineering") || t.includes("sprint") || t.includes("product")) {
    return "engineering";
  }
  const cycle: ChannelId[] = ["engineering", "sales-calls", "leadership", "my"];
  return cycle[meetingId % cycle.length];
}

export function deriveCaptureSource(meetingId: number, mediaUrl?: string | null): CaptureSource {
  if (mediaUrl && mediaUrl.includes("upload")) return "upload";
  const sources: CaptureSource[] = ["desktop", "extension", "recording", "voice-agent", "upload"];
  return sources[meetingId % sources.length];
}

export function isHostedByCurrentUser(participants: Array<{ name: string }>): boolean {
  if (!participants.length) return false;
  return participants[0].name === CURRENT_USER.name;
}

export function isSharedWithCurrentUser(participants: Array<{ name: string }>): boolean {
  return participants.some((p) => p.name === CURRENT_USER.name) && !isHostedByCurrentUser(participants);
}
