from pydantic import BaseModel, Field
from typing import Optional, List, Union, Any, Dict
from datetime import datetime, date

# Mood Schemas
class MoodCreate(BaseModel):
    mood: str  # Very Happy, Happy, Neutral, Sad, Anxious, Stressed, Angry, Exhausted
    intensity: int = Field(ge=1, le=10, default=5)
    energy_level: Optional[int] = Field(ge=1, le=10, default=5)
    tags: Optional[List[str]] = []
    notes: Optional[str] = None
    recorded_at: Optional[datetime] = None

class MoodResponse(BaseModel):
    id: int
    user_id: int
    mood: str
    intensity: int
    energy_level: Optional[int] = 5
    tags: Union[List[str], str]
    notes: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True

# Stress Schemas
class StressCreate(BaseModel):
    level: int = Field(ge=1, le=10)
    category: str  # Academics, Placements and Career, Relationships, Family, Financial Issues, Social Life, Personal Issues, Other
    tags: Optional[List[str]] = []
    notes: Optional[str] = None
    recorded_at: Optional[datetime] = None

class StressResponse(BaseModel):
    id: int
    user_id: int
    level: int
    category: str
    tags: Union[List[str], str]
    notes: Optional[str] = None
    recorded_at: datetime

    class Config:
        from_attributes = True

# Sleep Schemas
class SleepCreate(BaseModel):
    bedtime: str  # e.g. "23:00"
    wake_time: str  # e.g. "07:30"
    duration_hours: float = Field(ge=0.0, le=24.0)
    quality: int = Field(ge=1, le=5, default=3)
    factors: Optional[List[str]] = []
    notes: Optional[str] = None
    sleep_date: Optional[date] = None

class SleepResponse(BaseModel):
    id: int
    user_id: int
    bedtime: str
    wake_time: str
    duration_hours: float
    quality: int
    factors: Union[List[str], str]
    notes: Optional[str] = None
    sleep_date: date
    recorded_at: datetime

    class Config:
        from_attributes = True

# Unified Check-In Schemas (Phase 6)
class DailyCheckInRequest(BaseModel):
    mood: str  # e.g. "Happy", "Calm", "Neutral", "Anxious", "Stressed", "Exhausted"
    mood_intensity: int = Field(ge=1, le=10, default=5)
    stress_level: int = Field(ge=1, le=10, default=3)
    stress_category: Optional[str] = "Academics"
    sleep_hours: float = Field(ge=0.0, le=24.0, default=7.5)
    sleep_quality: Optional[int] = Field(ge=1, le=5, default=3)
    energy_level: int = Field(ge=1, le=10, default=6)  # 1 to 10
    tags: Optional[List[str]] = []
    notes: Optional[str] = None

class DailyCheckInResponse(BaseModel):
    success: bool
    message: str
    check_in_date: date
    is_today: bool
    mood_entry: MoodResponse
    stress_entry: StressResponse
    sleep_entry: SleepResponse
    energy_level: int
    weekly_streak_days: int
