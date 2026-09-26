from sqlalchemy import Column, Integer, String, Float, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    start_time_seconds = Column(Float, nullable=True)
    order_index = Column(Integer, nullable=False)

    meeting = relationship("Meeting", back_populates="topics")


Index("idx_topics_meeting", Topic.meeting_id)
