import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSummary, regenerateSummary } from "../../lib/api-client";

export function useSummary(meetingId: number | null | undefined) {
  return useQuery({
    queryKey: ["summary", meetingId],
    queryFn: () => getSummary(meetingId!),
    enabled: typeof meetingId === "number" && meetingId > 0,
  });
}

export function useRegenerateSummary(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => regenerateSummary(meetingId),
    onSuccess: (data) => {
      queryClient.setQueryData(["summary", meetingId], data);
    },
  });
}
