from sqlalchemy import Column, Integer, Text, String, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, unique=True)
    overview_text = Column(Text, nullable=False)
    generated_at = Column(String, nullable=False, server_default=func.datetime("now"))

    meeting = relationship("Meeting", back_populates="summary")
