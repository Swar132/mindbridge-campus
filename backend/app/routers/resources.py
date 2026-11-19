import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.user import User
from app.models.resource import WellbeingResource
from app.models.tracking import StressEntry, MoodEntry, SleepEntry
from app.schemas.resource import ResourceCreate, ResourceResponse
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/resources", tags=["Wellbeing Resources"])

@router.get("/personalized")
def get_personalized_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate personalized resource & tool recommendations based on the student's recent
    check-in patterns (stress category, mood intensity, sleep quality).
    """
    latest_stress = (
        db.query(StressEntry)
        .filter(StressEntry.user_id == current_user.id)
        .order_by(StressEntry.recorded_at.desc())
        .first()
    )
    latest_mood = (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == current_user.id)
        .order_by(MoodEntry.recorded_at.desc())
        .first()
    )
    latest_sleep = (
        db.query(SleepEntry)
        .filter(SleepEntry.user_id == current_user.id)
        .order_by(SleepEntry.recorded_at.desc())
        .first()
    )

    focus_category = "Academic Life"
    reason = "Personalized toolkit to balance coursework, finals preparation, and deep study."
    recommended_tools = ["study-planner", "pomodoro", "exam-countdown"]
    priority_tags = ["Exam Preparation", "Time Management"]

    if latest_stress and latest_stress.category:
        cat_lower = latest_stress.category.lower()
        if "placement" in cat_lower or "career" in cat_lower:
            focus_category = "Placement & Career"
            reason = "Curated resources for recruitment season, interview composure, and rejection recovery."
            recommended_tools = ["placement-tracker", "pomodoro", "goal-planner"]
            priority_tags = ["Placement Anxiety", "Interview Preparation"]
        elif "academic" in cat_lower or "exam" in cat_lower or "deadline" in cat_lower:
            focus_category = "Academic Life"
            reason = "Targeted tools to tackle syllabus overload, reduce exam panic, and organize deep work."
            recommended_tools = ["study-planner", "pomodoro", "exam-countdown"]
            priority_tags = ["Exam Preparation", "Procrastination"]
        elif "social" in cat_lower or "relationship" in cat_lower or "hostel" in cat_lower:
            focus_category = "Relationships & Social Life"
            reason = "Guidance on hostel communication, boundary setting, and building a supportive campus tribe."
            recommended_tools = ["mood-journal", "habit-tracker"]
            priority_tags = ["Hostel Adjustment", "Boundaries"]

    if focus_category != "Placement & Career" and latest_sleep:
        if (latest_sleep.duration_hours and latest_sleep.duration_hours < 6.5) or (latest_sleep.quality and latest_sleep.quality <= 2):
            focus_category = "Sleep & Physical Health"
            reason = "Recommended strategies to recover from sleep debt, reset circadian rhythm, and restore energy."
            recommended_tools = ["habit-tracker", "breathing-grounding"]
            priority_tags = ["Sleep Routines", "Managing Fatigue"]

    if latest_mood and latest_mood.mood in ["Anxious", "Stressed", "Overwhelmed", "Sad"]:
        if focus_category != "Placement & Career":
            focus_category = "Mental & Emotional Wellbeing"
            reason = "Somatic grounding exercises and cognitive reframing tools to quiet racing thoughts."
            recommended_tools = ["breathing-grounding", "mood-journal"]
            priority_tags = ["Anxiety Management", "Grounding"]

    # Retrieve matching guides from database
    recommended_resources = (
        db.query(WellbeingResource)
        .filter(WellbeingResource.category == focus_category)
        .limit(2)
        .all()
    )
    # Also fetch one featured resource
    featured = (
        db.query(WellbeingResource)
        .filter(WellbeingResource.is_featured == True, WellbeingResource.category != focus_category)
        .order_by(WellbeingResource.id.asc())
        .first()
    )
    if featured and len(recommended_resources) < 3:
        recommended_resources.append(featured)

    res_list = []
    for r in recommended_resources:
        try:
            tags = json.loads(r.tags) if isinstance(r.tags, str) else r.tags
        except Exception:
            tags = []
        res_list.append({
            "id": r.id,
            "title": r.title,
            "category": r.category,
            "content_type": r.content_type,
            "summary": r.summary,
            "content": r.content,
            "read_time_minutes": r.read_time_minutes,
            "tags": tags,
            "is_featured": r.is_featured
        })

    return {
        "focus_category": focus_category,
        "reason": reason,
        "recommended_tools": recommended_tools,
        "priority_tags": priority_tags,
        "recommended_resources": res_list
    }

@router.get("/", response_model=List[ResourceResponse])
def get_resources(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search keyword in title or summary"),
    db: Session = Depends(get_db)
):
    query = db.query(WellbeingResource)

    if category and category.lower() != "all":
        query = query.filter(WellbeingResource.category.ilike(f"%{category}%"))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                WellbeingResource.title.ilike(search_pattern),
                WellbeingResource.summary.ilike(search_pattern),
                WellbeingResource.content.ilike(search_pattern)
            )
        )

    resources = query.order_by(WellbeingResource.is_featured.desc(), WellbeingResource.created_at.desc()).all()
    for r in resources:
        try:
            r.tags = json.loads(r.tags) if isinstance(r.tags, str) else r.tags
        except Exception:
            r.tags = []
    return resources

@router.get("/{resource_id}", response_model=ResourceResponse)
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    r = db.query(WellbeingResource).filter(WellbeingResource.id == resource_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resource not found")
    r.tags = json.loads(r.tags) if isinstance(r.tags, str) else r.tags
    return r

@router.post("/", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED)
def create_resource(
    res_in: ResourceCreate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    r = WellbeingResource(
        title=res_in.title,
        category=res_in.category,
        content_type=res_in.content_type,
        summary=res_in.summary,
        content=res_in.content,
        read_time_minutes=res_in.read_time_minutes,
        tags=json.dumps(res_in.tags or []),
        is_featured=res_in.is_featured or False
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    r.tags = json.loads(r.tags) if isinstance(r.tags, str) else r.tags
    return r

@router.put("/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: int,
    res_in: ResourceCreate,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    r = db.query(WellbeingResource).filter(WellbeingResource.id == resource_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resource not found")

    r.title = res_in.title
    r.category = res_in.category
    r.content_type = res_in.content_type
    r.summary = res_in.summary
    r.content = res_in.content
    r.read_time_minutes = res_in.read_time_minutes
    r.tags = json.dumps(res_in.tags or [])
    r.is_featured = res_in.is_featured or False

    db.commit()
    db.refresh(r)
    r.tags = json.loads(r.tags) if isinstance(r.tags, str) else r.tags
    return r

@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    r = db.query(WellbeingResource).filter(WellbeingResource.id == resource_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Resource not found")
    db.delete(r)
    db.commit()
    return None
