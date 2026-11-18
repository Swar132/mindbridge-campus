from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatMessageRequest(BaseModel):
    message: str
    message_type: Optional[str] = "text"  # "text" or "voice"
    audio_url: Optional[str] = None
    conversation_id: Optional[int] = None
    consent_share_context: Optional[bool] = True

class AIMessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender: str
    content: str
    message_type: Optional[str] = "text"
    audio_url: Optional[str] = None
    safety_flagged: bool = False
    emergency_shown: bool = False
    suggested_resources: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AIConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[AIMessageResponse] = []

    class Config:
        from_attributes = True

class SuggestedPrompt(BaseModel):
    title: str
    prompt: str
    category: str
