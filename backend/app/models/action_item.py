from sqlalchemy import Column, Integer, String, Text, ForeignKey, Index, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(Text, nullable=False)
    assignee = Column(String, nullable=True)
    is_completed = Column(Integer, nullable=False, default=0)
    due_date = Column(String, nullable=True)  # ISO date or datetime string
    created_at = Column(String, nullable=False, server_default=func.datetime("now"))

    meeting = relationship("Meeting", back_populates="action_items")


Index("idx_action_items_meeting", ActionItem.meeting_id)
