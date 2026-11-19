from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "student"
    college_id: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[str] = None
    phone_number: Optional[str] = None
    country_code: Optional[str] = "+91"

class RegisterInitiateRequest(BaseModel):
    full_name: str
    email: str
    phone_number: str
    country_code: Optional[str] = "+91"
    password: str
    department: Optional[str] = "Computer Science & Engineering"
    year_of_study: Optional[str] = "3rd Year"
    college_id: Optional[str] = None

class RegisterInitiateResponse(BaseModel):
    success: bool
    session_id: str
    email_masked: str
    phone_masked: str
    expires_in_seconds: int = 300
    message: str

class VerifyEmailOTPRequest(BaseModel):
    session_id: str
    otp_code: str

class VerifyPhoneOTPRequest(BaseModel):
    session_id: str
    otp_code: str

class ResendOTPRequest(BaseModel):
    session_id: str
    target: str  # "email" or "phone"

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    college_id: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[str] = None
    avatar_url: Optional[str] = None
    phone_number: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    college_id: Optional[str] = None
    department: Optional[str] = None
    year_of_study: Optional[str] = None
    avatar_url: Optional[str] = None
    phone_number: Optional[str] = None
    phone_verified: bool = False
    email_verified: bool = False
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
