import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActionItems,
  createActionItem,
  updateActionItem,
  toggleActionItem,
  deleteActionItem,
} from "../../lib/api-client";
import { ActionItemCreateParams, ActionItemUpdateParams } from "../../types/api";

export function useActionItems(meetingId: number | null | undefined) {
  return useQuery({
    queryKey: ["action-items", meetingId],
    queryFn: () => getActionItems(meetingId!),
    enabled: typeof meetingId === "number" && meetingId > 0,
  });
}

export function useCreateActionItem(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ActionItemCreateParams) => createActionItem(meetingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-items", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useUpdateActionItem(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: ActionItemUpdateParams }) =>
      updateActionItem(itemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-items", meetingId] });
    },
  });
}

export function useToggleActionItem(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, isCompleted }: { itemId: number; isCompleted: boolean }) =>
      toggleActionItem(itemId, isCompleted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-items", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useDeleteActionItem(meetingId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => deleteActionItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-items", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
