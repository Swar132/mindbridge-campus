from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from app.database import Base

class WeeklyWellbeingReport(Base):
    __tablename__ = "weekly_wellbeing_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    
    # Stress metrics
    avg_stress = Column(Float, default=0.0)
    prev_avg_stress = Column(Float, nullable=True)
    stress_trend = Column(String(50), default="steady")  # "improved", "elevated", "steady", "insufficient"
    
    # Sleep metrics
    avg_sleep_hours = Column(Float, default=0.0)
    prev_avg_sleep_hours = Column(Float, nullable=True)
    sleep_trend = Column(String(50), default="steady")  # "improved", "deteriorated", "steady", "insufficient"
    
    # Energy metrics
    avg_energy = Column(Float, default=0.0)
    prev_avg_energy = Column(Float, nullable=True)
    energy_trend = Column(String(50), default="steady")  # "improved", "lower", "steady", "insufficient"
    
    # Mood metrics
    dominant_mood = Column(String(50), default="Neutral")
    prev_dominant_mood = Column(String(50), nullable=True)
    mood_trend = Column(String(50), default="steady")  # "more_positive", "lower", "steady"
    
    top_stress_domain = Column(String(100), nullable=True)
    summary_message = Column(Text, nullable=False)
    supportive_feedback = Column(Text, default="[]")  # JSON encoded list of supportive bullet points
    
    total_checkins_current_week = Column(Integer, default=0)
    total_checkins_prev_week = Column(Integer, default=0)
    is_sufficient_data = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", backref="weekly_reports")


class WellbeingAnomalyAlert(Base):
    __tablename__ = "wellbeing_anomaly_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # "sudden_stress_increase", "persistent_high_stress", "stress_domain_shift",
    # "sudden_sleep_drop", "sudden_sleep_increase", "repeated_poor_sleep",
    # "sudden_energy_drop", "repeated_low_mood"
    alert_type = Column(String(100), nullable=False)
    metric_name = Column(String(50), nullable=False)  # "stress", "sleep", "energy", "mood"
    severity = Column(String(50), default="medium")   # "info", "medium", "attention"
    
    baseline_value = Column(Float, nullable=True)
    observed_value = Column(Float, nullable=True)
    trigger_reason = Column(Text, nullable=False)
    supportive_message = Column(Text, nullable=False)
    
    # Sanitized context permitted to pass to Mindy AI without leaking raw private notes
    mindy_context = Column(Text, nullable=True)
    
    is_acknowledged = Column(Boolean, default=False)
    
    # Proactive Gradual Follow-Up Architecture
    # Stage 1: Initial alert with suggested action
    # Stage 2: Check-in on whether things have improved
    # Stage 3: Offer Mindy AI and curated resources
    # Stage 4: After 4-5 attempts, offer direct confidential access to campus counsellor
    follow_up_stage = Column(Integer, default=1)
    follow_up_count = Column(Integer, default=0)
    last_follow_up_at = Column(DateTime, nullable=True)
    resolution_status = Column(String(50), default="active")  # active, resolved_student_responded, resolved_improved, stopped_opt_out, dismissed
    
    # Interactive 1-tap student response
    # e.g. "I'm doing fine", "I've been stressed about placements", "I'm having trouble sleeping", "I'd like some advice", "I'd like to speak with a counsellor"
    student_response = Column(String(100), nullable=True)
    student_response_at = Column(DateTime, nullable=True)
    
    # Flags for compound co-occurring changes and positive improvement celebrations
    is_compound = Column(Boolean, default=False)
    is_positive_celebration = Column(Boolean, default=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", backref="anomaly_alerts")


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    endpoint = Column(Text, nullable=False)
    p256dh = Column(Text, nullable=False)
    auth = Column(Text, nullable=False)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="push_subscriptions")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(String(50), nullable=False)  # "in_app", "browser_push", "whatsapp"
    notification_type = Column(String(50), nullable=False)  # "daily_reminder", "weekly_report", "sudden_change_alert"
    title = Column(String(255), nullable=False)
    message_preview = Column(Text, nullable=True)
    status = Column(String(50), nullable=False)  # "sent", "failed", "skipped_quiet_hours", "skipped_already_checked_in", "skipped_cooldown"
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", backref="notification_logs")
