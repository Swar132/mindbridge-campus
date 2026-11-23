from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

class WhatsAppConnectRequest(BaseModel):
    phone_number: str = Field(..., description="Student WhatsApp phone number in E.164 format e.g. +919876543210")
    consent: bool = Field(True, description="Explicit opt-in consent for WhatsApp notifications")

class WhatsAppVerifyCodeRequest(BaseModel):
    phone_number: str
    code: str

class WhatsAppPreferencesResponse(BaseModel):
    whatsapp_phone: Optional[str] = None
    whatsapp_consent: bool = False
    whatsapp_consent_at: Optional[datetime] = None
    whatsapp_enabled: bool = False
    whatsapp_verified: bool = False
    whatsapp_reminders_consent: bool = True
    whatsapp_weekly_summary_consent: bool = True
    whatsapp_alerts_consent: bool = True
    whatsapp_followup_consent: bool = True
    whatsapp_counsellor_consent: bool = True
    whatsapp_mindy_consent: bool = True
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "07:00"
    preferred_days: List[str] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    is_paused: bool = False
    paused_until: Optional[date] = None
    provider_status: Dict[str, Any]

class WhatsAppPreferencesUpdate(BaseModel):
    whatsapp_enabled: Optional[bool] = None
    whatsapp_reminders_consent: Optional[bool] = None
    whatsapp_weekly_summary_consent: Optional[bool] = None
    whatsapp_alerts_consent: Optional[bool] = None
    whatsapp_followup_consent: Optional[bool] = None
    whatsapp_counsellor_consent: Optional[bool] = None
    whatsapp_mindy_consent: Optional[bool] = None
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
    message_type: str = "text"  # "text", "interactive_buttons", "template"
    custom_text: Optional[str] = None

class WhatsAppSimulateIncomingRequest(BaseModel):
    phone_number: str
    message_type: str = "text"  # "text", "button_reply", "list_reply"
    text: Optional[str] = None
    button_id: Optional[str] = None
    button_title: Optional[str] = None
