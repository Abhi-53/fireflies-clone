from sqlalchemy import Column, Integer, String, Text, Index, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False, index=True)
    meeting_date = Column(String, nullable=False, index=True)  # ISO-8601 string
    duration_seconds = Column(Integer, nullable=False, default=0)
    media_url = Column(String, nullable=True)
    created_at = Column(String, nullable=False, server_default=func.datetime("now"))
    updated_at = Column(String, nullable=False, server_default=func.datetime("now"), onupdate=func.datetime("now"))

    # Relationships
    participants = relationship(
        "Participant",
        secondary="meeting_participants",
        back_populates="meetings",
        lazy="joined"
    )
    speakers = relationship(
        "Speaker",
        back_populates="meeting",
        cascade="all, delete-orphan",
        lazy="select"
    )
    transcript_segments = relationship(
        "TranscriptSegment",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="TranscriptSegment.sequence_index",
        lazy="select"
    )
    summary = relationship(
        "Summary",
        back_populates="meeting",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="select"
    )
    topics = relationship(
        "Topic",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="Topic.order_index",
        lazy="select"
    )
    action_items = relationship(
        "ActionItem",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="ActionItem.id",
        lazy="select"
    )


# Explicit indexes from Section D.1
Index("idx_meetings_date", Meeting.meeting_date)
Index("idx_meetings_title", Meeting.title)
