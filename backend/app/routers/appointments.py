from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, CounsellorProfile
from app.models.appointment import Appointment
from app.models.notification import Notification
from app.schemas.appointment import AppointmentCreate, AppointmentStatusUpdate, AppointmentResponse
from app.auth import get_current_user

router = APIRouter(prefix="/appointments", tags=["Counselling Appointments"])

@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    apt_in: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    counsellor = db.query(CounsellorProfile).filter(CounsellorProfile.id == apt_in.counsellor_id).first()
    if not counsellor:
        raise HTTPException(status_code=404, detail="Counsellor profile not found")

    apt = Appointment(
        student_id=current_user.id,
        counsellor_id=apt_in.counsellor_id,
        appointment_date=apt_in.appointment_date,
        time_slot=apt_in.time_slot,
        reason=apt_in.reason,
        student_shared_notes=apt_in.student_shared_notes,
        share_wellbeing_summary=apt_in.share_wellbeing_summary or False,
        status="pending",
        meeting_room=counsellor.office_location
    )
    db.add(apt)
    db.flush()

    # Notify counsellor user
    notif = Notification(
        user_id=counsellor.user_id,
        title="New Counselling Appointment Request",
        message=f"{current_user.full_name} has requested a session for {apt_in.appointment_date} ({apt_in.time_slot}).",
        type="appointment",
        link="/counsellor"
    )
    db.add(notif)
    db.commit()
    db.refresh(apt)

    return _format_appointment(apt)

@router.get("/my", response_model=List[AppointmentResponse])
def get_my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "counsellor":
        counsellor_profile = db.query(CounsellorProfile).filter(CounsellorProfile.user_id == current_user.id).first()
        if not counsellor_profile:
            return []
        apts = db.query(Appointment).filter(
            Appointment.counsellor_id == counsellor_profile.id
        ).order_by(Appointment.appointment_date.desc()).all()
        return [_format_appointment(a, is_counsellor=True) for a in apts]

    elif current_user.role == "admin":
        apts = db.query(Appointment).order_by(Appointment.appointment_date.desc()).all()
        # Admin does NOT get counsellor_private_notes
        return [_format_appointment(a, is_counsellor=False) for a in apts]

    else:
        # Student
        apts = db.query(Appointment).filter(
            Appointment.student_id == current_user.id
        ).order_by(Appointment.appointment_date.desc()).all()
        # Students do NOT see counsellor internal private clinical notes
        return [_format_appointment(a, is_counsellor=False) for a in apts]

@router.put("/{apt_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    apt_id: int,
    status_in: AppointmentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apt = db.query(Appointment).filter(Appointment.id == apt_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Only the assigned counsellor or admin can approve/reject/complete
    counsellor_profile = db.query(CounsellorProfile).filter(CounsellorProfile.user_id == current_user.id).first()
    is_assigned_counsellor = counsellor_profile and counsellor_profile.id == apt.counsellor_id
    if not is_assigned_counsellor and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to update this appointment")

    apt.status = status_in.status
    if status_in.meeting_room:
        apt.meeting_room = status_in.meeting_room
    if status_in.meeting_link:
        apt.meeting_link = status_in.meeting_link
    if status_in.counsellor_private_notes is not None:
        apt.counsellor_private_notes = status_in.counsellor_private_notes
    if status_in.cancellation_reason:
        apt.cancellation_reason = status_in.cancellation_reason

    apt.updated_at = datetime.now(timezone.utc)

    # Notify student of status update
    status_label = status_in.status.capitalize()
    notif = Notification(
        user_id=apt.student_id,
        title=f"Appointment {status_label}",
        message=f"Your counselling session for {apt.appointment_date} has been {status_in.status}.",
        type="appointment",
        link="/appointments"
    )
    db.add(notif)
    db.commit()
    db.refresh(apt)

    return _format_appointment(apt, is_counsellor=True)

@router.put("/{apt_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    apt_id: int,
    cancellation_reason: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apt = db.query(Appointment).filter(Appointment.id == apt_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Either student or assigned counsellor can cancel
    counsellor_profile = db.query(CounsellorProfile).filter(CounsellorProfile.user_id == current_user.id).first()
    is_counsellor = counsellor_profile and counsellor_profile.id == apt.counsellor_id

    if apt.student_id != current_user.id and not is_counsellor and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to cancel this appointment")

    apt.status = "cancelled"
    apt.cancellation_reason = cancellation_reason or "Cancelled by user"
    apt.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(apt)

    return _format_appointment(apt, is_counsellor=is_counsellor)

def _format_appointment(apt: Appointment, is_counsellor: bool = False) -> AppointmentResponse:
    return AppointmentResponse(
        id=apt.id,
        student_id=apt.student_id,
        student_name=apt.student.full_name if apt.student else "Student",
        student_email=apt.student.email if apt.student else None,
        counsellor_id=apt.counsellor_id,
        counsellor_name=apt.counsellor.user.full_name if apt.counsellor and apt.counsellor.user else "Counsellor",
        counsellor_title=apt.counsellor.title if apt.counsellor else "Counsellor",
        appointment_date=apt.appointment_date,
        time_slot=apt.time_slot,
        reason=apt.reason,
        student_shared_notes=apt.student_shared_notes,
        share_wellbeing_summary=apt.share_wellbeing_summary,
        status=apt.status,
        meeting_room=apt.meeting_room,
        meeting_link=apt.meeting_link,
        counsellor_private_notes=apt.counsellor_private_notes if is_counsellor else None,
        cancellation_reason=apt.cancellation_reason,
        created_at=apt.created_at,
        updated_at=apt.updated_at
    )
