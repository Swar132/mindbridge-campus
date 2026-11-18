from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, CounsellorProfile
from app.models.tracking import MoodEntry, StressEntry, SleepEntry
from app.models.appointment import Appointment
from app.models.resource import WellbeingResource
from app.schemas.auth import UserResponse
from app.auth import require_admin

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

@router.get("/stats")
def get_platform_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).count()
    total_students = db.query(User).filter(User.role == "student").count()
    total_counsellors = db.query(User).filter(User.role == "counsellor").count()
    total_mood_logs = db.query(MoodEntry).count()
    total_stress_logs = db.query(StressEntry).count()
    total_sleep_logs = db.query(SleepEntry).count()
    total_appointments = db.query(Appointment).count()
    total_resources = db.query(WellbeingResource).count()

    return {
        "total_users": total_users,
        "total_students": total_students,
        "total_counsellors": total_counsellors,
        "total_mood_logs": total_mood_logs,
        "total_stress_logs": total_stress_logs,
        "total_sleep_logs": total_sleep_logs,
        "total_checkins": total_mood_logs + total_stress_logs + total_sleep_logs,
        "total_appointments": total_appointments,
        "total_resources": total_resources
    }

@router.get("/users", response_model=List[UserResponse])
def get_users(
    role: Optional[str] = Query(None, description="Filter by role: student, counsellor, admin"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()

@router.put("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    is_active: bool,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot alter own admin status")

    user.is_active = is_active
    db.commit()
    return {"message": f"User status updated to {'active' if is_active else 'inactive'}"}

@router.put("/users/{user_id}/role")
def change_user_role(
    user_id: int,
    new_role: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if new_role not in ["student", "counsellor", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = new_role
    if new_role == "counsellor":
        profile = db.query(CounsellorProfile).filter(CounsellorProfile.user_id == user.id).first()
        if not profile:
            profile = CounsellorProfile(user_id=user.id, contact_email=user.email)
            db.add(profile)

    db.commit()
    return {"message": f"User role changed to {new_role}"}
