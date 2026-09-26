/**
 * Fireflies Clone - Typed API Client
 * Wraps native fetch with shared error handling and typed response helpers.
 */

import {
  MeetingListItem,
  MeetingDetail,
  MeetingListResponse,
  MeetingCreateParams,
  MeetingUpdateParams,
  MeetingFilterParams,
  TranscriptResponse,
  TranscriptSearchMatch,
  MeetingSummaryResponse,
  ActionItem,
  ActionItemCreateParams,
  ActionItemUpdateParams,
  GlobalSearchResponse,
  ApiResponseError,
} from "../types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  public code: string;
  public status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorData = data as ApiResponseError;
    const errorCode = errorData?.error?.code || `HTTP_${response.status}`;
    const errorMessage = errorData?.error?.message || response.statusText || "Request failed";
    throw new ApiError(errorCode, errorMessage, response.status);
  }

  return data as T;
}

// ==================== Meetings API ====================

export async function getMeetings(filters: MeetingFilterParams = {}): Promise<MeetingListResponse> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.participant) params.set("participant", filters.participant);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.limit) params.set("limit", filters.limit.toString());
  if (filters.offset) params.set("offset", filters.offset.toString());

  const query = params.toString() ? `?${params.toString()}` : "";
  return request<MeetingListResponse>(`/meetings${query}`);
}

export async function getMeeting(id: number): Promise<MeetingDetail> {
  return request<MeetingDetail>(`/meetings/${id}`);
}

export async function createMeeting(payload: MeetingCreateParams): Promise<MeetingDetail> {
  return request<MeetingDetail>("/meetings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMeeting(id: number, payload: MeetingUpdateParams): Promise<MeetingDetail> {
  return request<MeetingDetail>(`/meetings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteMeeting(id: number): Promise<void> {
  await request<void>(`/meetings/${id}`, {
    method: "DELETE",
  });
}

// ==================== Transcript API ====================

export async function getTranscript(meetingId: number): Promise<TranscriptResponse> {
  return request<TranscriptResponse>(`/meetings/${meetingId}/transcript`);
}

export async function uploadTranscriptText(meetingId: number, rawText: string): Promise<TranscriptResponse> {
  return request<TranscriptResponse>(`/meetings/${meetingId}/transcript`, {
    method: "POST",
    body: JSON.stringify({ raw_text: rawText }),
  });
}

export async function uploadTranscriptFile(meetingId: number, file: File): Promise<TranscriptResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return request<TranscriptResponse>(`/meetings/${meetingId}/transcript`, {
    method: "POST",
    body: formData,
  });
}

export async function searchTranscript(meetingId: number, query: string): Promise<{ matches: TranscriptSearchMatch[] }> {
  return request<{ matches: TranscriptSearchMatch[] }>(
    `/meetings/${meetingId}/transcript/search?q=${encodeURIComponent(query)}`
  );
}

// ==================== Summary & Topics API ====================

export async function getSummary(meetingId: number): Promise<MeetingSummaryResponse> {
  return request<MeetingSummaryResponse>(`/meetings/${meetingId}/summary`);
}

export async function regenerateSummary(meetingId: number): Promise<MeetingSummaryResponse> {
  return request<MeetingSummaryResponse>(`/meetings/${meetingId}/summary/regenerate`, {
    method: "POST",
  });
}

// ==================== Action Items API ====================

export async function getActionItems(meetingId: number): Promise<ActionItem[]> {
  return request<ActionItem[]>(`/meetings/${meetingId}/action-items`);
}

export async function createActionItem(meetingId: number, payload: ActionItemCreateParams): Promise<ActionItem> {
  return request<ActionItem>(`/meetings/${meetingId}/action-items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateActionItem(itemId: number, payload: ActionItemUpdateParams): Promise<ActionItem> {
  return request<ActionItem>(`/action-items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function toggleActionItem(itemId: number, isCompleted: boolean): Promise<ActionItem> {
  return request<ActionItem>(`/action-items/${itemId}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ is_completed: isCompleted }),
  });
}

export async function deleteActionItem(itemId: number): Promise<void> {
  await request<void>(`/action-items/${itemId}`, {
    method: "DELETE",
  });
}

// ==================== Global Search & Export ====================

export async function globalSearch(query: string): Promise<GlobalSearchResponse> {
  return request<GlobalSearchResponse>(`/search?q=${encodeURIComponent(query)}`);
}

export function getExportUrl(meetingId: number, format: "pdf" | "md" | "txt" | "json" = "md"): string {
  return `${BASE_URL}/meetings/${meetingId}/export?format=${format}`;
}
