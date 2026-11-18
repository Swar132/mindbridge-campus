from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, CounsellorProfile
from app.schemas.appointment import CounsellorProfileResponse
from app.auth import get_current_user

router = APIRouter(prefix="/counsellors", tags=["Counsellors"])

@router.get("/", response_model=List[CounsellorProfileResponse])
def get_counsellors(db: Session = Depends(get_db)):
    counsellors = db.query(CounsellorProfile).join(User).filter(User.is_active == True).all()
    results = []
    for c in counsellors:
        results.append(CounsellorProfileResponse(
            id=c.id,
            user_id=c.user_id,
            full_name=c.user.full_name,
            avatar_url=c.user.avatar_url,
            title=c.title,
            qualifications=c.qualifications,
            experience_years=c.experience_years,
            areas_of_support=c.areas_of_support.split(", ") if c.areas_of_support else [],
            bio=c.bio,
            availability_hours=c.availability_hours,
            contact_email=c.contact_email,
            office_location=c.office_location
        ))
    return results

@router.get("/{counsellor_id}", response_model=CounsellorProfileResponse)
def get_counsellor(counsellor_id: int, db: Session = Depends(get_db)):
    c = db.query(CounsellorProfile).filter(CounsellorProfile.id == counsellor_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Counsellor not found")

    return CounsellorProfileResponse(
        id=c.id,
        user_id=c.user_id,
        full_name=c.user.full_name,
        avatar_url=c.user.avatar_url,
        title=c.title,
        qualifications=c.qualifications,
        experience_years=c.experience_years,
        areas_of_support=c.areas_of_support.split(", ") if c.areas_of_support else [],
        bio=c.bio,
        availability_hours=c.availability_hours,
        contact_email=c.contact_email,
        office_location=c.office_location
    )
