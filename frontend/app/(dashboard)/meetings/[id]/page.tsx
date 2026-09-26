"use client";

import { MeetingDetailView } from "@/components/notepad/MeetingDetailView";

export default function MeetingDetailPage({ params }: { params: { id: string } }) {
  const meetingId = parseInt(params.id, 10);
  return <MeetingDetailView meetingId={meetingId} />;
}
