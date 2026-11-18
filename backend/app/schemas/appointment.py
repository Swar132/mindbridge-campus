from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime, date

class CounsellorProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    avatar_url: Optional[str] = None
    title: str
    qualifications: str
    experience_years: int
    areas_of_support: Union[List[str], str]
    bio: Optional[str] = None
    availability_hours: str
    contact_email: Optional[str] = None
    office_location: str

    class Config:
        from_attributes = True

class AppointmentCreate(BaseModel):
    counsellor_id: int
    appointment_date: date
    time_slot: str  # e.g. "10:00 AM - 11:00 AM"
    reason: Optional[str] = None
    student_shared_notes: Optional[str] = None
    share_wellbeing_summary: Optional[bool] = False

class AppointmentStatusUpdate(BaseModel):
    status: str  # approved, rejected, completed, cancelled
    meeting_room: Optional[str] = None
    meeting_link: Optional[str] = None
    counsellor_private_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    counsellor_id: int
    counsellor_name: Optional[str] = None
    counsellor_title: Optional[str] = None
    appointment_date: date
    time_slot: str
    reason: Optional[str] = None
    student_shared_notes: Optional[str] = None
    share_wellbeing_summary: bool
    status: str
    meeting_room: Optional[str] = None
    meeting_link: Optional[str] = None
    counsellor_private_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
