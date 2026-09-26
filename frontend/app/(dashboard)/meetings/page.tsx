import { Suspense } from "react";
import { MeetingsLibrary } from "@/components/meetings/MeetingsLibrary";

export default function MeetingsPage() {
  return (
    <Suspense fallback={<div className="page">Loading meetings…</div>}>
      <MeetingsLibrary />
    </Suspense>
  );
}
