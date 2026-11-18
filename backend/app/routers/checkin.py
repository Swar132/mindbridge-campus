import json
from datetime import datetime, timezone, date, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.tracking import MoodEntry, StressEntry, SleepEntry
from app.schemas.tracking import DailyCheckInRequest, DailyCheckInResponse, MoodResponse, StressResponse, SleepResponse
from app.auth import get_current_user

router = APIRouter(prefix="/checkin", tags=["Daily Wellbeing Check-in"])

def calculate_streak(user_id: int, db: Session) -> int:
    # Calculate consecutive days with at least one mood check-in ending today or yesterday
    today = date.today()
    streak = 0
    curr_date = today
    
    # Check if logged today or yesterday to start streak
    logged_dates = set(
        d[0] for d in db.query(func.date(MoodEntry.recorded_at)).filter(MoodEntry.user_id == user_id).distinct().all()
    )
    
    # If not today, check if yesterday was logged
    today_str = today.strftime("%Y-%m-%d")
    yesterday_str = (today - timedelta(days=1)).strftime("%Y-%m-%d")
    
    if today_str in logged_dates:
        curr_date = today
    elif yesterday_str in logged_dates:
        curr_date = today - timedelta(days=1)
    else:
        return 0

    while True:
        d_str = curr_date.strftime("%Y-%m-%d")
        if d_str in logged_dates:
            streak += 1
            curr_date -= timedelta(days=1)
        else:
            break
    return streak

@router.get("/today")
def get_today_checkin_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
    
    mood_entry = db.query(MoodEntry).filter(
        MoodEntry.user_id == current_user.id,
        MoodEntry.recorded_at >= start_of_day
    ).order_by(MoodEntry.recorded_at.desc()).first()

    stress_entry = db.query(StressEntry).filter(
        StressEntry.user_id == current_user.id,
        StressEntry.recorded_at >= start_of_day
    ).order_by(StressEntry.recorded_at.desc()).first()

    sleep_entry = db.query(SleepEntry).filter(
        SleepEntry.user_id == current_user.id,
        SleepEntry.sleep_date == today
    ).first()

    streak = calculate_streak(current_user.id, db)

    has_checked_in = mood_entry is not None

    data = None
    if has_checked_in:
        mood_tags = json.loads(mood_entry.tags) if isinstance(mood_entry.tags, str) else (mood_entry.tags or [])
        data = {
            "mood": mood_entry.mood,
            "mood_intensity": mood_entry.intensity,
            "energy_level": getattr(mood_entry, "energy_level", 6) or 6,
            "stress_level": stress_entry.level if stress_entry else 3,
            "stress_category": stress_entry.category if stress_entry else "Academics",
            "sleep_hours": sleep_entry.duration_hours if sleep_entry else 7.5,
            "sleep_quality": sleep_entry.quality if sleep_entry else 3,
            "tags": mood_tags,
            "notes": mood_entry.notes or (stress_entry.notes if stress_entry else "") or ""
        }

    return {
        "has_checked_in": has_checked_in,
        "date": today.isoformat(),
        "streak_days": streak,
        "today_data": data
    }

@router.post("/", response_model=DailyCheckInResponse, status_code=status.HTTP_201_CREATED)
def submit_daily_checkin(
    checkin_in: DailyCheckInRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    now_utc = datetime.now(timezone.utc)
    start_of_day = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)

    # 1. Mood Entry (Update today's or create new)
    mood_entry = db.query(MoodEntry).filter(
        MoodEntry.user_id == current_user.id,
        MoodEntry.recorded_at >= start_of_day
    ).order_by(MoodEntry.recorded_at.desc()).first()

    tags_json = json.dumps(checkin_in.tags or [])

    if mood_entry:
        mood_entry.mood = checkin_in.mood
        mood_entry.intensity = checkin_in.mood_intensity
        mood_entry.energy_level = checkin_in.energy_level
        mood_entry.tags = tags_json
        mood_entry.notes = checkin_in.notes
        mood_entry.recorded_at = now_utc
    else:
        mood_entry = MoodEntry(
            user_id=current_user.id,
            mood=checkin_in.mood,
            intensity=checkin_in.mood_intensity,
            energy_level=checkin_in.energy_level,
            tags=tags_json,
            notes=checkin_in.notes,
            recorded_at=now_utc
        )
        db.add(mood_entry)

    # 2. Stress Entry (Update today's or create new)
    stress_entry = db.query(StressEntry).filter(
        StressEntry.user_id == current_user.id,
        StressEntry.recorded_at >= start_of_day
    ).order_by(StressEntry.recorded_at.desc()).first()

    if stress_entry:
        stress_entry.level = checkin_in.stress_level
        stress_entry.category = checkin_in.stress_category or "Academics"
        stress_entry.tags = tags_json
        stress_entry.notes = checkin_in.notes
        stress_entry.recorded_at = now_utc
    else:
        stress_entry = StressEntry(
            user_id=current_user.id,
            level=checkin_in.stress_level,
            category=checkin_in.stress_category or "Academics",
            tags=tags_json,
            notes=checkin_in.notes,
            recorded_at=now_utc
        )
        db.add(stress_entry)

    # 3. Sleep Entry (Update today's or create new)
    sleep_entry = db.query(SleepEntry).filter(
        SleepEntry.user_id == current_user.id,
        SleepEntry.sleep_date == today
    ).first()

    if sleep_entry:
        sleep_entry.duration_hours = checkin_in.sleep_hours
        sleep_entry.quality = checkin_in.sleep_quality or 3
        sleep_entry.recorded_at = now_utc
    else:
        sleep_entry = SleepEntry(
            user_id=current_user.id,
            bedtime="23:30",
            wake_time="07:00",
            duration_hours=checkin_in.sleep_hours,
            quality=checkin_in.sleep_quality or 3,
            factors=tags_json,
            notes=checkin_in.notes,
            sleep_date=today,
            recorded_at=now_utc
        )
        db.add(sleep_entry)

    db.commit()
    db.refresh(mood_entry)
    db.refresh(stress_entry)
    db.refresh(sleep_entry)

    # Decode JSON tags for response
    mood_entry.tags = json.loads(mood_entry.tags) if isinstance(mood_entry.tags, str) else mood_entry.tags
    stress_entry.tags = json.loads(stress_entry.tags) if isinstance(stress_entry.tags, str) else stress_entry.tags
    sleep_entry.factors = json.loads(sleep_entry.factors) if isinstance(sleep_entry.factors, str) else sleep_entry.factors

    streak = calculate_streak(current_user.id, db)

    return DailyCheckInResponse(
        success=True,
        message="Daily wellbeing check-in recorded successfully!",
        check_in_date=today,
        is_today=True,
        mood_entry=mood_entry,
        stress_entry=stress_entry,
        sleep_entry=sleep_entry,
        energy_level=checkin_in.energy_level,
        weekly_streak_days=streak
    )
