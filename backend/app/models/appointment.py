from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from app.database import Base

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    counsellor_id = Column(Integer, ForeignKey("counsellor_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    appointment_date = Column(Date, nullable=False)
    time_slot = Column(String(50), nullable=False)  # e.g. "10:00 AM - 11:00 AM"
    reason = Column(String(255), nullable=True)  # Student reason
    student_shared_notes = Column(Text, nullable=True)  # Voluntarily shared context
    share_wellbeing_summary = Column(Boolean, default=False)  # Consent to share 7-day mood summary
    status = Column(String(50), default="pending", nullable=False)  # pending, approved, rejected, completed, cancelled
    meeting_room = Column(String(255), default="Wellness Centre - Cabin 3")
    meeting_link = Column(String(500), nullable=True)
    counsellor_private_notes = Column(Text, nullable=True)  # STRICT: Counsellor only!
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("User", foreign_keys=[student_id])
    counsellor = relationship("CounsellorProfile", back_populates="appointments")
