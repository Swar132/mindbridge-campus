import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User, UserPreference, CounsellorProfile
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token, UserProfileUpdate
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.services.sms_service import clean_phone_number, validate_phone_number, SMSService

router = APIRouter(prefix="/auth", tags=["Authentication"])

def is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    email = user_in.email.strip().lower()
    if not email or not is_valid_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address (e.g., student@campus.edu)."
        )

    if not user_in.password or len(user_in.password.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    full_name = user_in.full_name.strip()
    if not full_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required."
        )

    # Check for duplicate user
    existing = db.query(User).filter(func.lower(User.email) == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please log in instead."
        )

    # Validate phone if provided
    phone_e164 = None
    if user_in.phone_number and user_in.phone_number.strip():
        phone_e164 = clean_phone_number(user_in.phone_number, user_in.country_code or "+91")
        is_valid, err = validate_phone_number(phone_e164)
        if not is_valid:
            raise HTTPException(status_code=400, detail=err)

    user = User(
        email=email,
        password_hash=hash_password(user_in.password.strip()),
        full_name=full_name,
        role=(user_in.role or "student").strip().lower(),
        college_id=user_in.college_id.strip() if user_in.college_id else None,
        department=user_in.department.strip() if user_in.department else None,
        year_of_study=user_in.year_of_study.strip() if user_in.year_of_study else None,
        phone_number=phone_e164,
        phone_verified=False
    )
    db.add(user)
    db.flush()

    # Create default user preferences
    pref = UserPreference(
        user_id=user.id,
        sms_reminders_enabled=False,
        sms_consent_given=False,
        timezone="Asia/Kolkata"
    )
    db.add(pref)

    # If registered as counsellor, create counsellor profile
    if user.role == "counsellor":
        profile = CounsellorProfile(
            user_id=user.id,
            contact_email=user.email,
            title="Campus Wellbeing Counsellor"
        )
        db.add(profile)

    db.commit()
    db.refresh(user)

    # If phone provided at signup, dispatch verification OTP
    if phone_e164:
        try:
            SMSService.send_verification_otp(db, user, phone_e164)
        except Exception as ex:
            print(f"[AUTH] Note: Failed to send OTP during registration: {ex}")

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    email = login_in.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email).first()
    
    # Backward compatibility for default counsellor demo email
    if not user and email == "counsellor@mindbridge.edu":
        user = db.query(User).filter(func.lower(User.email) == "nitusingh_b@dau.ac.in").first()

    if not user or not verify_password(login_in.password.strip(), user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please verify your credentials."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated. Please contact the campus wellness team."
        )

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully", "user_id": current_user.id}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name.strip()
    if profile_in.college_id is not None:
        current_user.college_id = profile_in.college_id.strip()
    if profile_in.department is not None:
        current_user.department = profile_in.department.strip()
    if profile_in.year_of_study is not None:
        current_user.year_of_study = profile_in.year_of_study.strip()
    if profile_in.avatar_url is not None:
        current_user.avatar_url = profile_in.avatar_url.strip()
    if profile_in.phone_number is not None:
        raw = profile_in.phone_number.strip()
        if raw:
            cleaned = clean_phone_number(raw)
            is_valid, err = validate_phone_number(cleaned)
            if not is_valid:
                raise HTTPException(status_code=400, detail=err)
            if current_user.phone_number != cleaned:
                current_user.phone_number = cleaned
                current_user.phone_verified = False
                if current_user.preferences:
                    current_user.preferences.sms_reminders_enabled = False
        else:
            current_user.phone_number = None
            current_user.phone_verified = False
            if current_user.preferences:
                current_user.preferences.sms_reminders_enabled = False

    db.commit()
    db.refresh(current_user)
    return current_user
