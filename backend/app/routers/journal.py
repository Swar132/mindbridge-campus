import json
from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.user import User
from app.models.journal import JournalEntry
from app.schemas.journal import JournalCreate, JournalUpdate, JournalResponse
from app.auth import get_current_user

router = APIRouter(prefix="/journal", tags=["Private Journal"])

@router.post("/", response_model=JournalResponse, status_code=status.HTTP_201_CREATED)
def create_journal(
    journal_in: JournalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = JournalEntry(
        user_id=current_user.id,
        title=journal_in.title,
        content=journal_in.content,
        mood_tag=journal_in.mood_tag,
        tags=json.dumps(journal_in.tags or []),
        voice_note_url=journal_in.voice_note_url,
        is_private=journal_in.is_private if journal_in.is_private is not None else True,
        entry_date=journal_in.entry_date or date.today()
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    entry.tags = json.loads(entry.tags) if isinstance(entry.tags, str) else entry.tags
    return entry

@router.get("/", response_model=List[JournalResponse])
def get_journals(
    search: Optional[str] = Query(None, description="Search query in title or content"),
    tag: Optional[str] = Query(None, description="Filter by specific tag"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Strictly query only current user's journal entries
    query = db.query(JournalEntry).filter(JournalEntry.user_id == current_user.id)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                JournalEntry.title.ilike(search_pattern),
                JournalEntry.content.ilike(search_pattern)
            )
        )

    if tag:
        query = query.filter(JournalEntry.tags.ilike(f"%{tag}%"))

    entries = query.order_by(JournalEntry.entry_date.desc(), JournalEntry.created_at.desc()).all()
    for e in entries:
        try:
            e.tags = json.loads(e.tags) if isinstance(e.tags, str) else e.tags
        except Exception:
            e.tags = []
    return entries

@router.get("/{entry_id}", response_model=JournalResponse)
def get_journal(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    entry.tags = json.loads(entry.tags) if isinstance(entry.tags, str) else entry.tags
    return entry

@router.put("/{entry_id}", response_model=JournalResponse)
def update_journal(
    entry_id: int,
    journal_in: JournalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    if journal_in.title is not None:
        entry.title = journal_in.title
    if journal_in.content is not None:
        entry.content = journal_in.content
    if journal_in.mood_tag is not None:
        entry.mood_tag = journal_in.mood_tag
    if journal_in.tags is not None:
        entry.tags = json.dumps(journal_in.tags)
    if journal_in.is_private is not None:
        entry.is_private = journal_in.is_private
    if journal_in.voice_note_url is not None:
        entry.voice_note_url = journal_in.voice_note_url

    entry.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(entry)
    entry.tags = json.loads(entry.tags) if isinstance(entry.tags, str) else entry.tags
    return entry

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    db.delete(entry)
    db.commit()
    return None
