import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.ai import AIConversation, AIMessage
from app.schemas.ai import ChatMessageRequest, AIMessageResponse, AIConversationResponse, SuggestedPrompt
from app.auth import get_current_user
from app.services.ai_service import generate_ai_response

router = APIRouter(prefix="/ai", tags=["AI Wellbeing Assistant"])

@router.get("/suggested-prompts", response_model=List[SuggestedPrompt])
def get_suggested_prompts():
    return [
        SuggestedPrompt(
            title="Exam & Academic Stress",
            prompt="I have multiple project submissions and midterm exams coming up next week, and I'm feeling completely overwhelmed.",
            category="Academics"
        ),
        SuggestedPrompt(
            title="Placement Anxiety",
            prompt="I didn't get shortlisted in the first company round, and it feels like everyone around me is securing offers. How do I cope?",
            category="Placements"
        ),
        SuggestedPrompt(
            title="Insomnia & Night Rumination",
            prompt="I can't fall asleep because my mind keeps racing through everything I need to accomplish tomorrow.",
            category="Sleep"
        ),
        SuggestedPrompt(
            title="Quick Grounding Exercise",
            prompt="My heart is beating fast and I feel a wave of anxiety right now. Can you guide me through a grounding exercise?",
            category="Grounding"
        ),
        SuggestedPrompt(
            title="Hostel Isolation",
            prompt="I'm feeling quite disconnected from my classmates and lonely in my hostel room.",
            category="Connection"
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

    # Generate AI response
    effective_message = chat_in.message
    if chat_in.message_type == "voice" and (not effective_message or effective_message.startswith("🎙️")):
        effective_message = "I just recorded and shared a voice note about my student wellbeing and feelings today."

    ai_result = generate_ai_response(
        user_message=effective_message,
        user_id=current_user.id,
        consent_share_context=chat_in.consent_share_context if chat_in.consent_share_context is not None else True,
        db=db
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
