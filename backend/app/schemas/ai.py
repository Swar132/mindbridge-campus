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
    reply: Optional[str] = None
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
    summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[AIMessageResponse] = []

    class Config:
        from_attributes = True

class StudentMemoryResponse(BaseModel):
    id: int
    user_id: int
    category: str
    topic: str
    key_point: str
    details: Optional[str] = None
    progress_status: str
    target_frequency: Optional[str] = None
    last_mentioned_at: Optional[datetime] = None
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class StudentMemoryCreateRequest(BaseModel):
    category: Optional[str] = "goal"
    topic: str
    key_point: str
    details: Optional[str] = None
    progress_status: Optional[str] = "active"
    target_frequency: Optional[str] = None

class SuggestedPrompt(BaseModel):
    title: str
    prompt: str
    category: str

class AIConfigResponse(BaseModel):
    provider: str
    model: str
    is_live_llm: bool
    groq_configured: bool
    gemini_configured: bool
    openai_configured: bool
    masked_key: Optional[str] = None

class AIConfigUpdateRequest(BaseModel):
    groq_api_key: Optional[str] = None
    groq_model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
