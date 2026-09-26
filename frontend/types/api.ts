/**
 * Fireflies Clone - TypeScript API Definitions
 * Mirrored directly from backend Pydantic schemas.
 */

export interface Participant {
  id: number;
  name: string;
  email?: string | null;
}

export interface MeetingListItem {
  id: number;
  title: string;
  meeting_date: string;
  duration_seconds: number;
  media_url?: string | null;
  participants: Participant[];
  action_items_count: number;
  created_at: string;
  updated_at: string;
}

export interface MeetingDetail {
  id: number;
  title: string;
  meeting_date: string;
  duration_seconds: number;
  media_url?: string | null;
  participants: Participant[];
  created_at: string;
  updated_at: string;
}

export interface MeetingListResponse {
  items: MeetingListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface MeetingCreateParams {
  title: string;
  meeting_date: string;
  participants: string[];
  media_url?: string;
  transcript_text?: string;
}

export interface MeetingUpdateParams {
  title?: string;
  meeting_date?: string;
  participants?: string[];
  media_url?: string;
  duration_seconds?: number;
}

export interface MeetingFilterParams {
  search?: string;
  participant?: string;
  date_from?: string;
  date_to?: string;
  sort?: "recent" | "oldest";
  limit?: number;
  offset?: number;
}

export interface Speaker {
  id: number;
  meeting_id: number;
  name: string;
  color_hex?: string | null;
}

export interface TranscriptSegment {
  id: number;
  meeting_id: number;
  speaker_id: number;
  speaker_name: string;
  speaker_color?: string | null;
  start_time_seconds: number;
  end_time_seconds?: number | null;
  text: string;
  sequence_index: number;
}

export interface TranscriptResponse {
  segments: TranscriptSegment[];
  speakers: Speaker[];
}

export interface TranscriptSearchMatch {
  segment_id: number;
  start_time_seconds: number;
  speaker_name: string;
  snippet: string;
}

export interface Summary {
  id: number;
  meeting_id: number;
  overview_text: string;
  generated_at: string;
}

export interface Topic {
  id: number;
  meeting_id: number;
  title: string;
  start_time_seconds?: number | null;
  order_index: number;
}

export interface MeetingSummaryResponse {
  summary: Summary | null;
  topics: Topic[];
}

export interface ActionItem {
  id: number;
  meeting_id: number;
  text: string;
  assignee?: string | null;
  is_completed: boolean;
  due_date?: string | null;
  created_at: string;
}

export interface ActionItemCreateParams {
  text: string;
  assignee?: string;
  due_date?: string;
}

export interface ActionItemUpdateParams {
  text?: string;
  assignee?: string;
  due_date?: string;
}

export interface GlobalSearchResponse {
  query: string;
  meetings: Array<{
    id: number;
    title: string;
    meeting_date: string;
    match_field: string;
  }>;
  transcripts: Array<{
    meeting_id: number;
    meeting_title: string;
    segment_id: number;
    speaker_name: string;
    start_time_seconds: number;
    text_snippet: string;
  }>;
  summaries: Array<{
    meeting_id: number;
    meeting_title: string;
    overview_snippet: string;
  }>;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiResponseError {
  error: ApiErrorDetail;
}
