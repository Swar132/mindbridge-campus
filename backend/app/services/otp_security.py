import hashlib
import secrets
from typing import Tuple, Optional

def generate_secure_otp() -> str:
    """Generates a cryptographically secure 6-digit numeric OTP."""
    return f"{secrets.randbelow(900000) + 100000}"

def hash_otp(otp: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """
    Hashes the OTP with a cryptographic salt using SHA-256.
    Returns (hex_digest, salt).
    """
    if not salt:
        salt = secrets.token_hex(16)
    raw = (otp.strip() + salt).encode("utf-8")
    hashed = hashlib.sha256(raw).hexdigest()
    return hashed, salt

def verify_otp_hash(plain_otp: str, hashed_otp: str, salt: str) -> bool:
    """
    Constant-time verification of raw OTP against stored SHA-256 hash.
    Prevents timing attacks.
    """
    if not plain_otp or not hashed_otp or not salt:
        return False
    raw = (plain_otp.strip() + salt).encode("utf-8")
    calculated = hashlib.sha256(raw).hexdigest()
    return secrets.compare_digest(calculated, hashed_otp)
