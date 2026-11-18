from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserPreferenceResponse(BaseModel):
    id: int
    user_id: int
    checkin_reminder_enabled: bool
    sleep_reminder_enabled: bool
    reminder_time: str
    consent_ai_analysis: bool
    email_notifications: bool

    class Config:
        from_attributes = True

class UserPreferenceUpdate(BaseModel):
    checkin_reminder_enabled: Optional[bool] = None
    sleep_reminder_enabled: Optional[bool] = None
    reminder_time: Optional[str] = None
    consent_ai_analysis: Optional[bool] = None
    email_notifications: Optional[bool] = None
