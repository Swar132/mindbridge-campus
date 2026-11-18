from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database import Base

class WellbeingResource(Base):
    __tablename__ = "wellbeing_resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)  # Stress Management, Anxiety Management, Academic Pressure, Placement Preparation Stress, Sleep Hygiene, Emotional Wellbeing, Relationships, Mindfulness and Meditation
    content_type = Column(String(50), default="article")  # article, exercise, breathing, meditation, guide
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    read_time_minutes = Column(Integer, default=5)
    tags = Column(Text, default="[]")  # JSON encoded list of tags
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
