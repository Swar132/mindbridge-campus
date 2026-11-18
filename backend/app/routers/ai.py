import os
import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.ai import AIConversation, AIMessage
from app.schemas.ai import (
    ChatMessageRequest,
    AIMessageResponse,
    AIConversationResponse,
    SuggestedPrompt,
    AIConfigResponse,
    AIConfigUpdateRequest
)
from app.auth import get_current_user
from app.services.ai_service import generate_ai_response, get_configured_provider

router = APIRouter(prefix="/ai", tags=["AI Wellbeing Assistant"])

@router.get("/config", response_model=AIConfigResponse)
def get_ai_status(current_user: User = Depends(get_current_user)):
    provider, model, is_live, masked_key = get_configured_provider()
    groq_key = (os.getenv("GROQ_API_KEY", "") or getattr(settings, "GROQ_API_KEY", "")).strip()
    gemini_key = (os.getenv("GEMINI_API_KEY", "") or getattr(settings, "GEMINI_API_KEY", "")).strip()
    openai_key = (os.getenv("OPENAI_API_KEY", "") or getattr(settings, "OPENAI_API_KEY", "")).strip()
    return AIConfigResponse(
        provider=provider,
        model=model,
        is_live_llm=is_live,
        groq_configured=bool(groq_key),
        gemini_configured=bool(gemini_key),
        openai_configured=bool(openai_key),
        masked_key=masked_key
    )

@router.post("/config", response_model=AIConfigResponse)
def update_ai_status(
    cfg: AIConfigUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
    
    env_lines = []
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                env_lines = f.readlines()
        except Exception:
            env_lines = []

    def set_env_var(key: str, val: str):
        os.environ[key] = val
        found = False
        new_lines = []
        for line in env_lines:
            if line.startswith(f"{key}="):
                new_lines.append(f'{key}="{val}"\n')
                found = True
            else:
                new_lines.append(line)
        if not found:
            new_lines.append(f'{key}="{val}"\n')
        env_lines[:] = new_lines

    if cfg.groq_api_key is not None:
        clean_key = cfg.groq_api_key.strip()
        set_env_var("GROQ_API_KEY", clean_key)
        settings.GROQ_API_KEY = clean_key
    if cfg.groq_model is not None:
        clean_model = cfg.groq_model.strip()
        set_env_var("GROQ_MODEL", clean_model)
        settings.GROQ_MODEL = clean_model
    if cfg.gemini_api_key is not None:
        clean_key = cfg.gemini_api_key.strip()
        set_env_var("GEMINI_API_KEY", clean_key)
        settings.GEMINI_API_KEY = clean_key
    if cfg.openai_api_key is not None:
        clean_key = cfg.openai_api_key.strip()
        set_env_var("OPENAI_API_KEY", clean_key)
        settings.OPENAI_API_KEY = clean_key

    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(env_lines)
    except Exception:
        pass

    return get_ai_status(current_user)

@router.get("/suggested-prompts", response_model=List[SuggestedPrompt])
def get_suggested_prompts():
    return [
        SuggestedPrompt(
            title="Placement Preparation Anxiety",
            prompt="I have technical rounds coming up for campus placements and I keep worrying that I'm not good enough compared to peers.",
            category="Placements"
        ),
        SuggestedPrompt(
            title="Exam & Project Overwhelm",
            prompt="I have multiple submissions and midterm exams next week. Help me break this down into a practical study plan.",
            category="Academics"
        ),
        SuggestedPrompt(
            title="Hostel & Roommate Friction",
            prompt="I had a frustrating argument with my hostel roommate and now the room feels completely hostile. How should I navigate this?",
            category="Hostel Life"
        ),
        SuggestedPrompt(
            title="Life & Motivation Reflection",
            prompt="I feel like I've been going through the motions lately with zero genuine motivation. How do I reconnect with what matters to me?",
            category="Personal Growth"
        ),
        SuggestedPrompt(
            title="Curiosity & Conceptual Doubt",
            prompt="Can you explain Dijkstra's algorithm simply with a real-life analogy as if we're preparing for an engineering viva?",
            category="Technical Curiosity"
        )
    ]

@router.post("/chat", response_model=AIMessageResponse)
async def chat_with_assistant(
    chat_in: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not chat_in.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Get or create conversation
    conversation = None
    if chat_in.conversation_id:
        conversation = db.query(AIConversation).filter(
            AIConversation.id == chat_in.conversation_id,
            AIConversation.user_id == current_user.id
        ).first()

    if not conversation:
        # Generate short title from first words
        first_words = chat_in.message.strip().split()[:5]
        title = " ".join(first_words) + ("..." if len(chat_in.message.split()) > 5 else "")
        conversation = AIConversation(
            user_id=current_user.id,
            title=title or "Wellbeing Conversation"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Save user message
    user_msg = AIMessage(
        conversation_id=conversation.id,
        sender="user",
        content=chat_in.message,
        message_type=chat_in.message_type or "text",
        audio_url=chat_in.audio_url
    )
    db.add(user_msg)
    db.commit()

    # Fetch past messages in this conversation for history context
    past_messages = (
        db.query(AIMessage)
        .filter(
            AIMessage.conversation_id == conversation.id,
            AIMessage.id != user_msg.id
        )
        .order_by(AIMessage.created_at.asc())
        .all()
    )
    # Take last 12 messages for conversation history
    history_records = past_messages[-12:] if len(past_messages) > 12 else past_messages
    conversation_history = [
        {
            "role": m.sender,
            "content": m.content
        }
        for m in history_records
    ]

    # Generate AI response
    effective_message = chat_in.message
    if chat_in.message_type == "voice" and (not effective_message or effective_message.startswith("🎙️")):
        effective_message = "I just recorded and shared a voice note about my student wellbeing and feelings today."

    ai_result = generate_ai_response(
        user_message=effective_message,
        user_id=current_user.id,
        consent_share_context=chat_in.consent_share_context if chat_in.consent_share_context is not None else True,
        db=db,
        conversation_history=conversation_history
    )

    # Save assistant message
    assistant_msg = AIMessage(
        conversation_id=conversation.id,
        sender="assistant",
        content=ai_result["content"],
        message_type="text",
        safety_flagged=ai_result.get("safety_flagged", False),
        emergency_shown=ai_result.get("emergency_shown", False),
        suggested_resources=json.dumps(ai_result.get("suggested_resources", []))
    )
    db.add(assistant_msg)
    conversation.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(assistant_msg)

    try:
        assistant_msg.suggested_resources = json.loads(assistant_msg.suggested_resources) if isinstance(assistant_msg.suggested_resources, str) else assistant_msg.suggested_resources
    except Exception:
        assistant_msg.suggested_resources = []

    assistant_msg.reply = assistant_msg.content
    return assistant_msg

@router.get("/conversations", response_model=List[AIConversationResponse])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convs = db.query(AIConversation).filter(
        AIConversation.user_id == current_user.id
    ).order_by(AIConversation.updated_at.desc()).all()
    return convs

@router.get("/conversations/{conversation_id}", response_model=AIConversationResponse)
def get_conversation_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    for msg in conv.messages:
        try:
            msg.suggested_resources = json.loads(msg.suggested_resources) if isinstance(msg.suggested_resources, str) else msg.suggested_resources
        except Exception:
            msg.suggested_resources = []
        msg.reply = msg.content

    return conv

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conv = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return None
