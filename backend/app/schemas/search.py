from typing import List, Optional
from pydantic import BaseModel


class SearchResultMeeting(BaseModel):
    id: int
    title: str
    meeting_date: str
    match_field: str  # e.g., 'title'


class SearchResultTranscript(BaseModel):
    meeting_id: int
    meeting_title: str
    segment_id: int
    speaker_name: str
    start_time_seconds: float
    text_snippet: str


class SearchResultSummary(BaseModel):
    meeting_id: int
    meeting_title: str
    overview_snippet: str


class GlobalSearchResponse(BaseModel):
    query: str
    meetings: List[SearchResultMeeting] = []
    transcripts: List[SearchResultTranscript] = []
    summaries: List[SearchResultSummary] = []
