import { useQuery } from "@tanstack/react-query";
import { globalSearch, searchTranscript } from "../../lib/api-client";

export function useGlobalSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["global-search", q],
    queryFn: () => globalSearch(q),
    enabled: q.length >= 2,
  });
}

export function useTranscriptSearch(meetingId: number | null | undefined, query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["transcript-search", meetingId, q],
    queryFn: () => searchTranscript(meetingId!, q),
    enabled: typeof meetingId === "number" && meetingId > 0 && q.length >= 2,
  });
}
