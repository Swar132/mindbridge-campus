from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

class WhatsAppConnectRequest(BaseModel):
    phone_number: str = Field(..., description="Student personal WhatsApp phone number (with or without country code)")
    country_code: str = Field("+91", description="Country calling code, e.g. +91, +1, +44")
    consent: bool = Field(True, description="Explicit opt-in consent for WhatsApp notifications")

class WhatsAppPreferencesResponse(BaseModel):
    whatsapp_phone: Optional[str] = None
    whatsapp_country_code: str = "+91"
    whatsapp_consent: bool = False
    whatsapp_consent_at: Optional[datetime] = None
    whatsapp_enabled: bool = False
    whatsapp_verified: bool = False
    whatsapp_reminders_consent: bool = True
    whatsapp_weekly_summary_consent: bool = True
    whatsapp_alerts_consent: bool = True
    whatsapp_followup_consent: bool = True
    whatsapp_counsellor_consent: bool = True
    whatsapp_academic_consent: bool = True
    whatsapp_last_delivery_status: Optional[str] = None
    whatsapp_last_delivery_at: Optional[datetime] = None
    whatsapp_last_error: Optional[str] = None
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "07:00"
    preferred_days: List[str] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    is_paused: bool = False
    paused_until: Optional[date] = None
    provider_status: Dict[str, Any]

class WhatsAppPreferencesUpdate(BaseModel):
    whatsapp_enabled: Optional[bool] = None
    whatsapp_country_code: Optional[str] = None
    whatsapp_reminders_consent: Optional[bool] = None
    whatsapp_weekly_summary_consent: Optional[bool] = None
    whatsapp_alerts_consent: Optional[bool] = None
    whatsapp_followup_consent: Optional[bool] = None
    whatsapp_counsellor_consent: Optional[bool] = None
    whatsapp_academic_consent: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    preferred_days: Optional[List[str]] = None
    is_paused: Optional[bool] = None
    paused_until: Optional[date] = None

class WhatsAppMessageResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    wa_message_id: Optional[str] = None
    phone_number: str
    direction: str
    message_type: str
    body: Optional[str] = None
    status: str
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    conversation_context: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class WhatsAppTestMessageRequest(BaseModel):
    phone_number: Optional[str] = None
    notification_category: str = "daily_reminder"  # "daily_reminder", "weekly_summary", "wellbeing_alert", "academic_reminder", "test"
    custom_text: Optional[str] = None

