from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ActionItemCreate(BaseModel):
    text: str = Field(..., min_length=1)
    assignee: Optional[str] = None
    due_date: Optional[str] = None


class ActionItemUpdate(BaseModel):
    text: Optional[str] = Field(None, min_length=1)
    assignee: Optional[str] = None
    due_date: Optional[str] = None


class ActionItemComplete(BaseModel):
    is_completed: bool


class ActionItemResponse(BaseModel):
    id: int
    meeting_id: int
    text: str
    assignee: Optional[str] = None
    is_completed: bool
    due_date: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)
