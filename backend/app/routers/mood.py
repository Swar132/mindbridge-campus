import json
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.tracking import MoodEntry
from app.schemas.tracking import MoodCreate, MoodResponse
from app.auth import get_current_user

router = APIRouter(prefix="/mood", tags=["Mood Tracking"])

@router.post("/", response_model=MoodResponse, status_code=status.HTTP_201_CREATED)
def create_mood(
    mood_in: MoodCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = MoodEntry(
        user_id=current_user.id,
        mood=mood_in.mood,
        intensity=mood_in.intensity,
        tags=json.dumps(mood_in.tags or []),
        notes=mood_in.notes,
        recorded_at=mood_in.recorded_at or datetime.now(timezone.utc)
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    entry.tags = json.loads(entry.tags) if isinstance(entry.tags, str) else entry.tags
    return entry

@router.get("/", response_model=List[MoodResponse])
def get_moods(
    days: Optional[int] = Query(30, description="Number of days to retrieve (e.g. 7, 30, 90)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(MoodEntry).filter(MoodEntry.user_id == current_user.id)
    if days and days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        query = query.filter(MoodEntry.recorded_at >= cutoff)

    entries = query.order_by(MoodEntry.recorded_at.desc()).all()
    for e in entries:
        try:
            e.tags = json.loads(e.tags) if isinstance(e.tags, str) else e.tags
        except Exception:
            e.tags = []
    return entries

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mood(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(MoodEntry).filter(MoodEntry.id == entry_id, MoodEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Mood entry not found")
    db.delete(entry)
    db.commit()
    return None
