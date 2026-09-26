from typing import Optional
from pydantic import BaseModel, ConfigDict


class ParticipantBase(BaseModel):
    name: str
    email: Optional[str] = None


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantResponse(ParticipantBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
