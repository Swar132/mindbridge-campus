from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from app.database import Base

class PendingRegistration(Base):
    __tablename__ = "pending_registrations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone_number = Column(String(30), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False)
    college_id = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    year_of_study = Column(String(50), nullable=True)

    # Email OTP details (Hashed)
    email_otp_hash = Column(String(128), nullable=False)
    email_otp_salt = Column(String(32), nullable=False)
    email_otp_expires_at = Column(DateTime(timezone=True), nullable=False)
    email_attempts = Column(Integer, default=0)
    email_verified = Column(Boolean, default=False)
    last_email_sent_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Phone OTP details (Hashed)
    phone_otp_hash = Column(String(128), nullable=False)
    phone_otp_salt = Column(String(32), nullable=False)
    phone_otp_expires_at = Column(DateTime(timezone=True), nullable=False)
    phone_attempts = Column(Integer, default=0)
    phone_verified = Column(Boolean, default=False)
    last_phone_sent_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)
