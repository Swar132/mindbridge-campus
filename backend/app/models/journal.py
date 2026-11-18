from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from app.database import Base

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    mood_tag = Column(String(50), nullable=True)  # Associated feeling e.g. "Reflective", "Anxious", "Grateful"
    tags = Column(Text, default="[]")  # JSON encoded list of tags
    voice_note_url = Column(Text, nullable=True)  # Audio data URI or relative URL
    is_private = Column(Boolean, default=True, nullable=False)
    entry_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="journal_entries")
