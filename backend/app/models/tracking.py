from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from app.database import Base

class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    mood = Column(String(50), nullable=False)  # Very Happy, Happy, Neutral, Sad, Anxious, Stressed, Angry, Exhausted
    intensity = Column(Integer, default=5)  # 1 to 10
    energy_level = Column(Integer, default=5)  # 1 to 10 (Fatigued to Highly Energized)
    tags = Column(Text, default="[]")  # JSON encoded list of tags e.g. ["Academics", "Exams"]
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="mood_entries")

class StressEntry(Base):
    __tablename__ = "stress_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    level = Column(Integer, nullable=False)  # 1 to 10
    category = Column(String(100), nullable=False)  # Academics, Placements and Career, Relationships, Family, Financial Issues, Social Life, Personal Issues, Other
    tags = Column(Text, default="[]")  # JSON encoded tags
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="stress_entries")

class SleepEntry(Base):
    __tablename__ = "sleep_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    bedtime = Column(String(50), nullable=False)  # e.g. "23:30" or ISO format
    wake_time = Column(String(50), nullable=False)  # e.g. "07:15"
    duration_hours = Column(Float, nullable=False)  # e.g. 7.75
    quality = Column(Integer, default=3)  # 1 to 5 (Poor to Excellent)
    factors = Column(Text, default="[]")  # JSON list e.g. ["Late study", "Caffeine", "Calm night"]
    notes = Column(Text, nullable=True)
    sleep_date = Column(Date, default=date.today, index=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="sleep_entries")
