import json
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.tracking import StressEntry
from app.schemas.tracking import StressCreate, StressResponse
from app.auth import get_current_user

router = APIRouter(prefix="/stress", tags=["Stress Tracking"])

@router.post("/", response_model=StressResponse, status_code=status.HTTP_201_CREATED)
def create_stress(
    stress_in: StressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = StressEntry(
        user_id=current_user.id,
        level=stress_in.level,
        category=stress_in.category,
        tags=json.dumps(stress_in.tags or []),
        notes=stress_in.notes,
        recorded_at=stress_in.recorded_at or datetime.now(timezone.utc)
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    entry.tags = json.loads(entry.tags) if isinstance(entry.tags, str) else entry.tags
    return entry

@router.get("/", response_model=List[StressResponse])
def get_stress_entries(
    days: Optional[int] = Query(30, description="Number of days to retrieve"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(StressEntry).filter(StressEntry.user_id == current_user.id)
    if days and days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        query = query.filter(StressEntry.recorded_at >= cutoff)

    entries = query.order_by(StressEntry.recorded_at.desc()).all()
    for e in entries:
        try:
            e.tags = json.loads(e.tags) if isinstance(e.tags, str) else e.tags
        except Exception:
            e.tags = []
    return entries

@router.get("/summary")
def get_stress_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    entries = db.query(StressEntry).filter(
        StressEntry.user_id == current_user.id,
        StressEntry.recorded_at >= cutoff
    ).all()

    category_counts: Dict[str, int] = {}
    total_level = 0
    for e in entries:
        category_counts[e.category] = category_counts.get(e.category, 0) + 1
        total_level += e.level

    avg_level = round(total_level / len(entries), 1) if entries else 0.0

    return {
        "average_level": avg_level,
        "total_entries_30d": len(entries),
        "category_distribution": category_counts,
        "most_frequent_trigger": max(category_counts, key=category_counts.get) if category_counts else "None"
    }

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stress(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(StressEntry).filter(StressEntry.id == entry_id, StressEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Stress entry not found")
    db.delete(entry)
    db.commit()
    return None
