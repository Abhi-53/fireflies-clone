from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class SpeakerResponse(BaseModel):
    id: int
    meeting_id: int
    name: str
    color_hex: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TranscriptSegmentResponse(BaseModel):
    id: int
    meeting_id: int
    speaker_id: int
    speaker_name: str
    speaker_color: Optional[str] = None
    start_time_seconds: float
    end_time_seconds: Optional[float] = None
    text: str
    sequence_index: int

    model_config = ConfigDict(from_attributes=True)


class TranscriptResponse(BaseModel):
    segments: List[TranscriptSegmentResponse]
    speakers: List[SpeakerResponse]


class TranscriptUpload(BaseModel):
    raw_text: Optional[str] = None


class TranscriptSearchMatch(BaseModel):
    segment_id: int
    start_time_seconds: float
    speaker_name: str
    snippet: str


class TranscriptSearchResponse(BaseModel):
    matches: List[TranscriptSearchMatch]
