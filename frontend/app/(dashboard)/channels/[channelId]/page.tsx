import { Suspense } from "react";
import { MeetingsLibrary } from "@/components/meetings/MeetingsLibrary";
import { CHANNELS, channelLabel } from "@/lib/workspace";
import type { ChannelId } from "@/lib/workspace";

export default function ChannelPage({ params }: { params: { channelId: string } }) {
  const id = params.channelId as ChannelId;
  const known = CHANNELS.find((c) => c.id === id);
  const title = known ? channelLabel(id) : "Channel";
  return (
    <Suspense fallback={<div className="page">Loading channel…</div>}>
      <MeetingsLibrary channelId={id} title={title} />
    </Suspense>
  );
}
