from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class TopicResponse(BaseModel):
    id: int
    meeting_id: int
    title: str
    start_time_seconds: Optional[float] = None
    order_index: int

    model_config = ConfigDict(from_attributes=True)


class SummaryResponse(BaseModel):
    id: int
    meeting_id: int
    overview_text: str
    generated_at: str

    model_config = ConfigDict(from_attributes=True)


class MeetingSummaryResponse(BaseModel):
    summary: Optional[SummaryResponse] = None
    topics: List[TopicResponse] = []
