from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class WhatsAppMessage(Base):
    """
    Tracks all inbound and outbound WhatsApp Business API messages,
    delivery statuses (sent, delivered, read, failed), and interactive payloads.
    """
    __tablename__ = "whatsapp_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    wa_message_id = Column(String(100), unique=True, index=True, nullable=True)
    phone_number = Column(String(30), nullable=False, index=True)
    direction = Column(String(15), nullable=False, default="outbound")  # "inbound", "outbound"
    message_type = Column(String(30), default="text")  # "text", "template", "interactive_button", "interactive_list", "system"
    body = Column(Text, nullable=True)
    payload = Column(Text, nullable=True)  # JSON payload of interactive buttons/lists or incoming event
    status = Column(String(25), default="sent", index=True)  # "queued", "sent", "delivered", "read", "failed"
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    conversation_context = Column(String(50), nullable=True)  # "daily_reminder", "anomaly_alert", "follow_up", "weekly_report", "mindy_chat", "counsellor_reminder"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="whatsapp_messages")


class WhatsAppConversation(Base):
    """
    Tracks the active student WhatsApp session, 24-hour service window,
    multi-step interactive dialog state, and links to Mindy AI conversational memory.
    """
    __tablename__ = "whatsapp_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    phone_number = Column(String(30), nullable=False, index=True)
    last_user_message_at = Column(DateTime, nullable=True)
    current_state = Column(String(50), default="idle")  # "idle", "checkin_in_progress", "mindy_chat", "counsellor_booking"
    state_data = Column(Text, nullable=True)  # JSON serialized state dictionary
    ai_conversation_id = Column(Integer, ForeignKey("ai_conversations.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="whatsapp_conversations")
    ai_conversation = relationship("AIConversation")


class WhatsAppTemplate(Base):
    """
    Tracks official Meta pre-approved message templates for business-initiated
    messages outside the 24-hour customer service window.
    """
    __tablename__ = "whatsapp_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), default="UTILITY")  # "UTILITY", "MARKETING", "AUTHENTICATION"
    language = Column(String(10), default="en")
    status = Column(String(30), default="APPROVED")  # "APPROVED", "PENDING", "REJECTED", "PAUSED"
    components_json = Column(Text, nullable=False)  # JSON list of header, body, buttons
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
