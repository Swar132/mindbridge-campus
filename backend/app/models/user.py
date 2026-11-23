from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False)  # student, counsellor, admin
    college_id = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    year_of_study = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    phone_number = Column(String(30), nullable=True, index=True)  # E.164 e.g. +919876543210
    phone_verified = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    counsellor_profile = relationship("CounsellorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    mood_entries = relationship("MoodEntry", back_populates="user", cascade="all, delete-orphan")
    stress_entries = relationship("StressEntry", back_populates="user", cascade="all, delete-orphan")
    sleep_entries = relationship("SleepEntry", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("AIConversation", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("StudentMemory", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class CounsellorProfile(Base):
    __tablename__ = "counsellor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    title = Column(String(150), default="Campus Wellbeing Counsellor")
    qualifications = Column(String(255), default="M.Sc. Clinical Psychology, Certified Counsellor")
    experience_years = Column(Integer, default=5)
    areas_of_support = Column(Text, default="Academic Stress, Anxiety, Career Uncertainty, Relationships") # Comma separated or JSON string
    bio = Column(Text, nullable=True)
    availability_hours = Column(String(255), default="Mon-Fri, 10:00 AM - 5:00 PM")
    contact_email = Column(String(255), nullable=True)
    office_location = Column(String(255), default="Student Wellness Centre, Block B, Room 204")

    user = relationship("User", back_populates="counsellor_profile")
    appointments = relationship("Appointment", back_populates="counsellor", cascade="all, delete-orphan")

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    checkin_reminder_enabled = Column(Boolean, default=True)
    sleep_reminder_enabled = Column(Boolean, default=True)
    reminder_time = Column(String(10), default="20:00")
    consent_ai_analysis = Column(Boolean, default=True)
    email_notifications = Column(Boolean, default=True)

    # SMS Reminder Configuration
    sms_reminders_enabled = Column(Boolean, default=False)
    reminder_frequency = Column(String(20), default="daily")  # "daily", "weekdays"
    timezone = Column(String(50), default="Asia/Kolkata")
    sms_consent_given = Column(Boolean, default=False)
    sms_consent_at = Column(DateTime, nullable=True)
    last_reminder_sent_date = Column(Date, nullable=True)

    # Intelligent Wellbeing Monitoring & Notification Preferences
    daily_reminder_enabled = Column(Boolean, default=True)
    weekly_summary_enabled = Column(Boolean, default=True)
    sudden_change_alerts_enabled = Column(Boolean, default=True)
    browser_push_enabled = Column(Boolean, default=False)
    whatsapp_enabled = Column(Boolean, default=False)
    preferred_days = Column(Text, default='["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]')
    quiet_hours_start = Column(String(10), default="22:00")
    quiet_hours_end = Column(String(10), default="07:00")
    whatsapp_phone = Column(String(30), nullable=True)
    whatsapp_consent = Column(Boolean, default=False)
    whatsapp_consent_at = Column(DateTime, nullable=True)
    last_daily_reminder_date = Column(Date, nullable=True)
    last_weekly_report_date = Column(Date, nullable=True)

    # Proactive Wellbeing Support Controls
    counsellor_referral_enabled = Column(Boolean, default=True)
    follow_up_frequency_days = Column(Integer, default=2)  # Follow-up frequency in days (1-7)
    is_paused = Column(Boolean, default=False)            # Pause all non-critical notifications
    paused_until = Column(Date, nullable=True)

    # Granular Category Consents for WhatsApp Business Channel
    whatsapp_reminders_consent = Column(Boolean, default=True)
    whatsapp_weekly_summary_consent = Column(Boolean, default=True)
    whatsapp_alerts_consent = Column(Boolean, default=True)
    whatsapp_followup_consent = Column(Boolean, default=True)
    whatsapp_counsellor_consent = Column(Boolean, default=True)
    whatsapp_mindy_consent = Column(Boolean, default=True)
    whatsapp_verified = Column(Boolean, default=False)
    whatsapp_verification_code = Column(String(20), nullable=True)

    user = relationship("User", back_populates="preferences")
