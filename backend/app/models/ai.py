from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class StudentMemory(Base):
    """
    Persistent long-term memory for student goals, academic stressors,
    placement preparation commitments, habits, and progress updates.
    Enables Mindy to follow up proactively and maintain continuity across sessions.
    """
    __tablename__ = "student_memories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(50), default="goal", nullable=False)  # "goal", "academic", "placement", "habit", "stressor", "preference"
    topic = Column(String(255), default="General Goal", nullable=False)  # e.g. "DSA Problem Solving", "Placement Prep", "Sleep Schedule"
    key_point = Column(Text, nullable=False)  # e.g. "Wants to solve 2 DSA problems daily on LeetCode"
    details = Column(Text, nullable=True)  # Context, progress updates, or notes
    progress_status = Column(String(50), default="active", nullable=False)  # "active", "in_progress", "achieved", "struggling", "paused"
    target_frequency = Column(String(100), nullable=True)  # e.g. "daily", "weekdays", "2 problems/day"
    last_mentioned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="memories")

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), default="Wellbeing Conversation")
    summary = Column(Text, nullable=True)  # High-level takeaway of key topics discussed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="conversations")
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at")

class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")  # "text" or "voice"
    audio_url = Column(Text, nullable=True)  # Audio data URI or voice note URL
    safety_flagged = Column(Boolean, default=False)
    emergency_shown = Column(Boolean, default=False)
    suggested_resources = Column(Text, default="[]")  # JSON list of resource IDs or suggestions
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    conversation = relationship("AIConversation", back_populates="messages")
