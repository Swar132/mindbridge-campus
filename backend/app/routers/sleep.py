import json
from datetime import datetime, timedelta, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.tracking import SleepEntry
from app.schemas.tracking import SleepCreate, SleepResponse
from app.auth import get_current_user

router = APIRouter(prefix="/sleep", tags=["Sleep Tracking"])

@router.post("/", response_model=SleepResponse, status_code=status.HTTP_201_CREATED)
def create_sleep(
    sleep_in: SleepCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = SleepEntry(
        user_id=current_user.id,
        bedtime=sleep_in.bedtime,
        wake_time=sleep_in.wake_time,
        duration_hours=sleep_in.duration_hours,
        quality=sleep_in.quality,
        factors=json.dumps(sleep_in.factors or []),
        notes=sleep_in.notes,
        sleep_date=sleep_in.sleep_date or date.today()
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    entry.factors = json.loads(entry.factors) if isinstance(entry.factors, str) else entry.factors
    return entry

@router.get("/", response_model=List[SleepResponse])
def get_sleep_entries(
    days: Optional[int] = Query(30, description="Number of days to retrieve"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(SleepEntry).filter(SleepEntry.user_id == current_user.id)
    if days and days > 0:
        cutoff = date.today() - timedelta(days=days)
        query = query.filter(SleepEntry.sleep_date >= cutoff)

    entries = query.order_by(SleepEntry.sleep_date.desc()).all()
    for e in entries:
        try:
            e.factors = json.loads(e.factors) if isinstance(e.factors, str) else e.factors
        except Exception:
            e.factors = []
    return entries

@router.get("/metrics")
def get_sleep_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cutoff = date.today() - timedelta(days=14)
    entries = db.query(SleepEntry).filter(
        SleepEntry.user_id == current_user.id,
        SleepEntry.sleep_date >= cutoff
    ).order_by(SleepEntry.sleep_date.desc()).all()

    if not entries:
        return {
            "average_hours": 0.0,
            "average_quality": 0.0,
            "consistency_percentage": 75,
            "target_hours": 7.5,
            "debt_hours": 0.0
        }

    total_hours = sum(e.duration_hours for e in entries)
    avg_hours = round(total_hours / len(entries), 1)
    avg_quality = round(sum(e.quality for e in entries) / len(entries), 1)

    # Consistency
    if len(entries) >= 2:
        variance = sum((e.duration_hours - avg_hours) ** 2 for e in entries) / len(entries)
        std_dev = variance ** 0.5
        consistency = max(50, min(98, int(100 - (std_dev * 15))))
    else:
        consistency = 80

    debt = round((7.5 * len(entries)) - total_hours, 1)

    return {
        "average_hours": avg_hours,
        "average_quality": avg_quality,
        "consistency_percentage": consistency,
        "target_hours": 7.5,
        "debt_hours": debt
    }

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sleep(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entry = db.query(SleepEntry).filter(SleepEntry.id == entry_id, SleepEntry.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Sleep entry not found")
    db.delete(entry)
    db.commit()
    return None
