import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} from "../../lib/api-client";
import { MeetingFilterParams, MeetingCreateParams, MeetingUpdateParams } from "../../types/api";

export function useMeetings(filters: MeetingFilterParams = {}) {
  return useQuery({
    queryKey: ["meetings", filters],
    queryFn: () => getMeetings(filters),
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MeetingCreateParams) => createMeeting(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useUpdateMeeting(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MeetingUpdateParams) => updateMeeting(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.invalidateQueries({ queryKey: ["meeting", id] });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
