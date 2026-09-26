from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    speaker_id = Column(Integer, ForeignKey("speakers.id", ondelete="CASCADE"), nullable=False)
    start_time_seconds = Column(Float, nullable=False)
    end_time_seconds = Column(Float, nullable=True)
    text = Column(Text, nullable=False)
    sequence_index = Column(Integer, nullable=False)

    meeting = relationship("Meeting", back_populates="transcript_segments")
    speaker = relationship("Speaker", back_populates="segments")


Index("idx_segments_meeting_seq", TranscriptSegment.meeting_id, TranscriptSegment.sequence_index)
Index("idx_segments_meeting", TranscriptSegment.meeting_id)
