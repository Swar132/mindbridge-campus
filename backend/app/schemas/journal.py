from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import datetime, date

class JournalCreate(BaseModel):
    title: str
    content: str
    mood_tag: Optional[str] = None
    tags: Optional[List[str]] = []
    voice_note_url: Optional[str] = None
    is_private: Optional[bool] = True
    entry_date: Optional[date] = None

class JournalUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    mood_tag: Optional[str] = None
    tags: Optional[List[str]] = None
    voice_note_url: Optional[str] = None
    is_private: Optional[bool] = None

class JournalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    mood_tag: Optional[str] = None
    tags: Union[List[str], str]
    voice_note_url: Optional[str] = None
    is_private: bool
    entry_date: date
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
