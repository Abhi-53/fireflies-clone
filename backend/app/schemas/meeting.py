from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.participant import ParticipantResponse


class MeetingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    meeting_date: str = Field(..., description="ISO-8601 formatted datetime string")
    duration_seconds: int = Field(default=0, ge=0)
    media_url: Optional[str] = None


class MeetingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    meeting_date: str = Field(..., description="ISO-8601 formatted datetime string")
    participants: List[str] = Field(default_factory=list, description="List of participant names")
    media_url: Optional[str] = None
    transcript_text: Optional[str] = Field(None, description="Optional raw transcript text to parse and populate")


class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    meeting_date: Optional[str] = None
    participants: Optional[List[str]] = None
    media_url: Optional[str] = None
    duration_seconds: Optional[int] = Field(None, ge=0)


class MeetingListItem(BaseModel):
    id: int
    title: str
    meeting_date: str
    duration_seconds: int
    media_url: Optional[str]
    participants: List[ParticipantResponse]
    action_items_count: int = 0
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class MeetingDetail(BaseModel):
    id: int
    title: str
    meeting_date: str
    duration_seconds: int
    media_url: Optional[str]
    participants: List[ParticipantResponse]
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class MeetingListResponse(BaseModel):
    items: List[MeetingListItem]
    total: int
    limit: int
    offset: int
