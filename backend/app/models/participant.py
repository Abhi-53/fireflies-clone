from sqlalchemy import Column, Integer, String, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=True)

    meetings = relationship(
        "Meeting",
        secondary="meeting_participants",
        back_populates="participants"
    )


class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True)
    participant_id = Column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), primary_key=True, index=True)


Index("idx_mp_participant", MeetingParticipant.participant_id)
