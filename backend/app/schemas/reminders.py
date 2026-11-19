from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

class PhoneUpdateRequest(BaseModel):
    phone_number: str
    country_code: Optional[str] = "+91"

class SendOTPRequest(BaseModel):
    phone_number: str

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str

class ReminderPreferencesUpdate(BaseModel):
    sms_reminders_enabled: Optional[bool] = None
    reminder_time: Optional[str] = None  # e.g. "20:30"
    reminder_frequency: Optional[str] = None  # "daily" or "weekdays"
    timezone: Optional[str] = None  # "Asia/Kolkata"
    sms_consent_given: Optional[bool] = None

class ReminderStatusResponse(BaseModel):
    phone_number: Optional[str] = None
    phone_masked: Optional[str] = None
    phone_verified: bool
    sms_reminders_enabled: bool
    reminder_time: str
    reminder_frequency: str
    timezone: str
    sms_consent_given: bool
    sms_consent_at: Optional[datetime] = None
    last_reminder_sent_date: Optional[date] = None
    provider_info: Dict[str, Any]

class SMSLogResponse(BaseModel):
    id: int
    phone_masked: str
    message_type: str
    status: str
    provider: str
    sent_at: datetime
    error_message: Optional[str] = None
