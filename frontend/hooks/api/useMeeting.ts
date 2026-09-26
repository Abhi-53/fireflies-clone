import { useQuery } from "@tanstack/react-query";
import { getMeeting } from "../../lib/api-client";

export function useMeeting(id: number | null | undefined) {
  return useQuery({
    queryKey: ["meeting", id],
    queryFn: () => getMeeting(id!),
    enabled: typeof id === "number" && id > 0,
  });
}
