from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class PhoneVerification(Base):
    __tablename__ = "phone_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    phone_number = Column(String(30), nullable=False, index=True)
    otp_code = Column(String(10), nullable=True, default=None)
    otp_hash = Column(String(128), nullable=False)
    otp_salt = Column(String(32), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_verified = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)

    user = relationship("User", foreign_keys=[user_id])

class SMSLog(Base):
    __tablename__ = "sms_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    phone_number = Column(String(30), nullable=False, index=True)
    message_type = Column(String(50), nullable=False)  # "otp", "welcome", "daily_reminder", "test_reminder", "opt_out"
    message_body = Column(Text, nullable=False)
    provider = Column(String(50), nullable=False)  # "twilio", "fast2sms", "msg91"
    provider_message_id = Column(String(255), nullable=True)
    status = Column(String(50), default="sent")  # "sent", "delivered", "failed"
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", foreign_keys=[user_id])
