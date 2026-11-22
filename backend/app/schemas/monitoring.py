from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class WeeklyWellbeingReportResponse(BaseModel):
    id: int
    user_id: int
    week_start: date
    week_end: date
    avg_stress: float
    prev_avg_stress: Optional[float]
    stress_trend: str
    avg_sleep_hours: float
    prev_avg_sleep_hours: Optional[float]
    sleep_trend: str
    avg_energy: float
    prev_avg_energy: Optional[float]
    energy_trend: str
    dominant_mood: str
    prev_dominant_mood: Optional[str]
    mood_trend: str
    top_stress_domain: Optional[str]
    summary_message: str
    supportive_feedback: List[str]
    total_checkins_current_week: int
    total_checkins_prev_week: int
    is_sufficient_data: bool
    created_at: datetime

    class Config:
        from_attributes = True

class WellbeingAnomalyAlertResponse(BaseModel):
    id: int
    user_id: int
    alert_type: str
    metric_name: str
    severity: str
    baseline_value: Optional[float]
    observed_value: Optional[float]
    trigger_reason: str
    supportive_message: str
    mindy_context: Optional[str]
    is_acknowledged: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: str
    auth: str
    user_agent: Optional[str] = None

class NotificationPreferenceResponse(BaseModel):
    checkin_reminder_enabled: bool
    daily_reminder_enabled: bool
    weekly_summary_enabled: bool
    sudden_change_alerts_enabled: bool
    browser_push_enabled: bool
    whatsapp_enabled: bool
    reminder_time: str
    preferred_days: List[str]
    quiet_hours_start: str
    quiet_hours_end: str
    timezone: str
    whatsapp_phone: Optional[str]
    whatsapp_consent: bool
    whatsapp_status: Dict[str, Any]

class NotificationPreferenceUpdate(BaseModel):
    daily_reminder_enabled: Optional[bool] = None
    weekly_summary_enabled: Optional[bool] = None
    sudden_change_alerts_enabled: Optional[bool] = None
    browser_push_enabled: Optional[bool] = None
    whatsapp_enabled: Optional[bool] = None
    reminder_time: Optional[str] = None
    preferred_days: Optional[List[str]] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    timezone: Optional[str] = None
    whatsapp_phone: Optional[str] = None
    whatsapp_consent: Optional[bool] = None

class WhatsAppOptInRequest(BaseModel):
    phone_number: str
    consent: bool

class NotificationLogResponse(BaseModel):
    id: int
    channel: str
    notification_type: str
    title: str
    message_preview: Optional[str]
    status: str
    error_message: Optional[str]
    sent_at: datetime

    class Config:
        from_attributes = True
