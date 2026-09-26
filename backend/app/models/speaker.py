from sqlalchemy import Column, Integer, String, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class Speaker(Base):
    __tablename__ = "speakers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    color_hex = Column(String, nullable=True)

    meeting = relationship("Meeting", back_populates="speakers")
    segments = relationship("TranscriptSegment", back_populates="speaker", cascade="all, delete-orphan")


Index("idx_speakers_meeting", Speaker.meeting_id)
