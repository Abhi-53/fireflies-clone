import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTranscript, uploadTranscriptText, uploadTranscriptFile } from "../../lib/api-client";

export function useTranscript(meetingId: number | null | undefined) {
  return useQuery({
    queryKey: ["transcript", meetingId],
    queryFn: () => getTranscript(meetingId!),
    enabled: typeof meetingId === "number" && meetingId > 0,
  });
}

export function useUploadTranscriptText(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rawText: string) => uploadTranscriptText(meetingId, rawText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transcript", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
    },
  });
}

export function useUploadTranscriptFile(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadTranscriptFile(meetingId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transcript", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
    },
  });
}
