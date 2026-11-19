import re
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User, UserPreference, CounsellorProfile
from app.models.registration import PendingRegistration
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    Token,
    UserProfileUpdate,
    RegisterInitiateRequest,
    RegisterInitiateResponse,
    VerifyEmailOTPRequest,
    VerifyPhoneOTPRequest,
    ResendOTPRequest,
)
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.services.sms_service import (
    clean_phone_number,
    validate_phone_number,
    mask_phone_number,
    SMSService,
    OTP_MESSAGE_TEMPLATE,
    WELCOME_SMS_MESSAGE
)
from app.services.email_service import EmailService
from app.services.otp_security import generate_secure_otp, hash_otp, verify_otp_hash

router = APIRouter(prefix="/auth", tags=["Authentication & 2FA Verification"])

def is_valid_email(email: str) -> bool:
    return bool(re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email))

def mask_email(email: str) -> str:
    if "@" not in email:
        return email
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        masked_local = local[0] + "*"
    else:
        masked_local = local[0] + "*" * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"

def to_utc_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


# ---------------------------------------------------------------------------
# 2-Factor Production Registration Workflow
# ---------------------------------------------------------------------------

@router.post("/register-initiate", response_model=RegisterInitiateResponse, status_code=status.HTTP_200_OK)
def register_initiate(payload: RegisterInitiateRequest, db: Session = Depends(get_db)):
    """
    Step 1 of Production Registration:
    Validates credentials, sends REAL email OTP and REAL phone OTP.
    Creates a secure pending registration session with SHA-256 hashed OTPs.
    """
    email = payload.email.strip().lower()
    if not email or not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Please enter a valid campus email address.")

    if not payload.password or len(payload.password.strip()) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    full_name = payload.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=400, detail="Full name is required.")

    # Validate phone
    phone_e164 = clean_phone_number(payload.phone_number, payload.country_code or "+91")
    is_valid, phone_err = validate_phone_number(phone_e164)
    if not is_valid:
        raise HTTPException(status_code=400, detail=phone_err)

    # Check for existing accounts
    existing_email = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="An account with this email address already exists. Please log in.")

    existing_phone = db.query(User).filter(User.phone_number == phone_e164).first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="This phone number is already registered to another student account.")

    # Generate 6-digit cryptographic OTPs
    email_otp = generate_secure_otp()
    email_hash, email_salt = hash_otp(email_otp)

    phone_otp = generate_secure_otp()
    phone_hash, phone_salt = hash_otp(phone_otp)

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=5)
    session_id = secrets.token_urlsafe(32)

    # Clean up any stale uncompleted pending registrations for this email
    db.query(PendingRegistration).filter(
        func.lower(PendingRegistration.email) == email,
        PendingRegistration.is_completed == False
    ).delete()

    # Store pending session
    pending = PendingRegistration(
        session_id=session_id,
        email=email,
        phone_number=phone_e164,
        password_hash=hash_password(payload.password.strip()),
        full_name=full_name,
        role="student",
        department=payload.department,
        year_of_study=payload.year_of_study,
        college_id=payload.college_id,
        email_otp_hash=email_hash,
        email_otp_salt=email_salt,
        email_otp_expires_at=expires_at,
        email_attempts=0,
        email_verified=False,
        last_email_sent_at=now,
        phone_otp_hash=phone_hash,
        phone_otp_salt=phone_salt,
        phone_otp_expires_at=expires_at,
        phone_attempts=0,
        phone_verified=False,
        last_phone_sent_at=now,
        is_completed=False,
        created_at=now,
        expires_at=now + timedelta(minutes=15)
    )
    db.add(pending)
    db.commit()

    # Dispatch REAL Email OTP
    try:
        EmailService.send_otp_email(email, full_name, email_otp)
    except Exception as email_ex:
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Email delivery failed: {email_ex}"
        )

    # Dispatch REAL SMS OTP
    try:
        sms_text = OTP_MESSAGE_TEMPLATE.format(otp=phone_otp)
        SMSService.dispatch_sms(phone_e164, sms_text, message_type="otp", db=db)
    except Exception as sms_ex:
        db.delete(pending)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"SMS delivery failed: {sms_ex}"
        )

    return RegisterInitiateResponse(
        success=True,
        session_id=session_id,
        email_masked=mask_email(email),
        phone_masked=mask_phone_number(phone_e164),
        expires_in_seconds=300,
        message="Verification codes have been dispatched to your email and phone."
    )


def finalize_account_registration(pending: PendingRegistration, db: Session) -> Dict[str, Any]:
    """Creates the user, sends welcome email & SMS, and returns Token payload."""
    now = datetime.now(timezone.utc)

    user = User(
        email=pending.email,
        password_hash=pending.password_hash,
        full_name=pending.full_name,
        role=pending.role,
        college_id=pending.college_id,
        department=pending.department,
        year_of_study=pending.year_of_study,
        phone_number=pending.phone_number,
        phone_verified=True,
        email_verified=True,
        is_active=True,
        created_at=now
    )
    db.add(user)
    db.flush()

    # Create default user preferences with SMS reminders active
    pref = UserPreference(
        user_id=user.id,
        sms_reminders_enabled=True,
        sms_consent_given=True,
        sms_consent_at=now,
        reminder_time="20:00",
        timezone="Asia/Kolkata"
    )
    db.add(pref)

    pending.is_completed = True
    db.commit()
    db.refresh(user)

    # Dispatch REAL Welcome SMS
    try:
        SMSService.dispatch_sms(
            user.phone_number,
            WELCOME_SMS_MESSAGE,
            message_type="welcome",
            user_id=user.id,
            db=db
        )
    except Exception as sms_err:
        print(f"[AUTH] Welcome SMS notice: {sms_err}")

    # Dispatch REAL Welcome Email
    try:
        EmailService.send_welcome_email(user.email, user.full_name)
    except Exception as email_err:
        print(f"[AUTH] Welcome email notice: {email_err}")

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
        "completed": True,
        "message": "Account successfully registered and verified!"
    }


@router.post("/register-verify-email")
def register_verify_email(payload: VerifyEmailOTPRequest, db: Session = Depends(get_db)):
    """Verifies student's Email OTP against cryptographic hash."""
    now = datetime.now(timezone.utc)
    pending = db.query(PendingRegistration).filter(
        PendingRegistration.session_id == payload.session_id,
        PendingRegistration.is_completed == False
    ).first()

    if not pending:
        raise HTTPException(status_code=400, detail="Registration session expired or invalid. Please start again.")

    exp_utc = to_utc_aware(pending.email_otp_expires_at)
    if exp_utc and exp_utc < now:
        raise HTTPException(status_code=400, detail="Email verification code has expired. Please request a new code.")

    if pending.email_attempts >= 5:
        raise HTTPException(status_code=400, detail="Too many failed email verification attempts. Please request a new code.")

    pending.email_attempts += 1

    if not verify_otp_hash(payload.otp_code.strip(), pending.email_otp_hash, pending.email_otp_salt):
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect email verification code. Please check and try again.")

    pending.email_verified = True
    db.commit()

    # If both email and phone are verified, finalize registration immediately
    if pending.phone_verified:
        return finalize_account_registration(pending, db)

    return {
        "success": True,
        "email_verified": True,
        "phone_verified": pending.phone_verified,
        "completed": False,
        "message": "Email verified successfully! Please enter your SMS verification code."
    }


@router.post("/register-verify-phone")
def register_verify_phone(payload: VerifyPhoneOTPRequest, db: Session = Depends(get_db)):
    """Verifies student's Phone SMS OTP against cryptographic hash."""
    now = datetime.now(timezone.utc)
    pending = db.query(PendingRegistration).filter(
        PendingRegistration.session_id == payload.session_id,
        PendingRegistration.is_completed == False
    ).first()

    if not pending:
        raise HTTPException(status_code=400, detail="Registration session expired or invalid. Please start again.")

    exp_utc = to_utc_aware(pending.phone_otp_expires_at)
    if exp_utc and exp_utc < now:
        raise HTTPException(status_code=400, detail="SMS verification code has expired. Please request a new code.")

    if pending.phone_attempts >= 5:
        raise HTTPException(status_code=400, detail="Too many failed phone verification attempts. Please request a new code.")

    pending.phone_attempts += 1

    if not verify_otp_hash(payload.otp_code.strip(), pending.phone_otp_hash, pending.phone_otp_salt):
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect SMS verification code. Please check and try again.")

    pending.phone_verified = True
    db.commit()

    # If both email and phone are verified, finalize registration immediately
    if pending.email_verified:
        return finalize_account_registration(pending, db)

    return {
        "success": True,
        "email_verified": pending.email_verified,
        "phone_verified": True,
        "completed": False,
        "message": "Phone verified successfully! Please complete email verification."
    }


@router.post("/register-resend-otp")
def register_resend_otp(payload: ResendOTPRequest, db: Session = Depends(get_db)):
    """Resends Email or SMS OTP with 60-second cooldown."""
    now = datetime.now(timezone.utc)
    one_min_ago = now - timedelta(seconds=60)

    pending = db.query(PendingRegistration).filter(
        PendingRegistration.session_id == payload.session_id,
        PendingRegistration.is_completed == False
    ).first()

    if not pending:
        raise HTTPException(status_code=400, detail="Registration session expired or invalid.")

    target = payload.target.lower().strip()
    if target == "email":
        sent_utc = to_utc_aware(pending.last_email_sent_at)
        if sent_utc and sent_utc >= one_min_ago:
            raise HTTPException(status_code=400, detail="Please wait at least 60 seconds before resending email code.")

        otp_code = generate_secure_otp()
        h, s = hash_otp(otp_code)
        pending.email_otp_hash = h
        pending.email_otp_salt = s
        pending.email_otp_expires_at = now + timedelta(minutes=5)
        pending.email_attempts = 0
        pending.last_email_sent_at = now
        db.commit()

        try:
            EmailService.send_otp_email(pending.email, pending.full_name, otp_code)
        except Exception as ex:
            raise HTTPException(status_code=503, detail=f"Email delivery failed: {ex}")

        return {"success": True, "message": f"New verification code sent to {mask_email(pending.email)}."}

    elif target == "phone":
        sent_utc = to_utc_aware(pending.last_phone_sent_at)
        if sent_utc and sent_utc >= one_min_ago:
            raise HTTPException(status_code=400, detail="Please wait at least 60 seconds before resending SMS code.")

        otp_code = generate_secure_otp()
        h, s = hash_otp(otp_code)
        pending.phone_otp_hash = h
        pending.phone_otp_salt = s
        pending.phone_otp_expires_at = now + timedelta(minutes=5)
        pending.phone_attempts = 0
        pending.last_phone_sent_at = now
        db.commit()

        try:
            sms_text = OTP_MESSAGE_TEMPLATE.format(otp=otp_code)
            SMSService.dispatch_sms(pending.phone_number, sms_text, message_type="otp", db=db)
        except Exception as ex:
            raise HTTPException(status_code=503, detail=f"SMS delivery failed: {ex}")

        return {"success": True, "message": f"New verification code sent to {mask_phone_number(pending.phone_number)}."}

    else:
        raise HTTPException(status_code=400, detail="Invalid target. Must be 'email' or 'phone'.")


# ---------------------------------------------------------------------------
# Direct / Standard Registration & Auth Routes
# ---------------------------------------------------------------------------

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Direct registration endpoint for scripts or testing."""
    email = user_in.email.strip().lower()
    if not email or not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    if not user_in.password or len(user_in.password.strip()) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    full_name = user_in.full_name.strip()
    if not full_name:
        raise HTTPException(status_code=400, detail="Full name is required.")

    existing = db.query(User).filter(func.lower(User.email) == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")

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
        phone_verified=False,
        email_verified=False
    )
    db.add(user)
    db.flush()

    pref = UserPreference(
        user_id=user.id,
        sms_reminders_enabled=False,
        sms_consent_given=False,
        timezone="Asia/Kolkata"
    )
    db.add(pref)

    if user.role == "counsellor":
        profile = CounsellorProfile(
            user_id=user.id,
            contact_email=user.email,
            title="Campus Wellbeing Counsellor"
        )
        db.add(profile)

    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    email = login_in.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == email).first()
    
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
