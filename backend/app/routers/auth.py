import uuid
import json
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.config import settings
from app.utils.dependencies import get_db
from app.utils.security import hash_password, verify_password, create_access_token
from schemas.user_schema import (
    GmailLoginRequest,
    GoogleTokenLoginRequest,
    TokenResponse,
    UserLogin,
    UserOut,
    UserRegister,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


def _allowed_admin_google_entries() -> set[str]:
    allowlist = {entry.strip().lower() for entry in settings.ADMIN_GMAILS.split(",") if entry.strip()}
    admin_email = settings.ADMIN_EMAIL.strip().lower()
    if admin_email:
        allowlist.add(admin_email)
    return allowlist


def _is_allowed_admin_google_email(email: str) -> bool:
    email = email.strip().lower()
    if "@" not in email:
        return False

    domain = email.split("@", 1)[1]
    entries = _allowed_admin_google_entries()
    for entry in entries:
        if entry == email:
            return True
        if entry.startswith("@") and domain == entry[1:]:
            return True
        if "@" not in entry and domain == entry:
            return True
    return False


def _resolve_admin_user(email: str, db: Session) -> User | None:
    user = db.query(User).filter(User.email == email, User.role == "admin").first()
    if user:
        return user

    # Keep compatibility with single-owner mode: approved Google accounts can log in as owner admin.
    return db.query(User).filter(User.username == settings.ADMIN_USERNAME, User.role == "admin").first()


def _verify_google_id_token(id_token: str) -> dict:
    if not settings.GOOGLE_CLIENT_ID.strip():
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_CLIENT_ID is not configured on server",
        )

    query = urlencode({"id_token": id_token})
    url = f"https://oauth2.googleapis.com/tokeninfo?{query}"

    try:
        with urlopen(url, timeout=8) as response:
            data = json.loads(response.read().decode("utf-8"))
    except URLError:
        raise HTTPException(status_code=400, detail="Unable to verify Google token")

    aud = str(data.get("aud", "")).strip()
    if aud != settings.GOOGLE_CLIENT_ID.strip():
        raise HTTPException(status_code=403, detail="Google token audience mismatch")

    if str(data.get("email_verified", "false")).lower() != "true":
        raise HTTPException(status_code=403, detail="Google email is not verified")

    email = str(data.get("email", "")).strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google token has no email")

    return data


@router.post("/register", response_model=UserOut)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User)
        .filter((User.username == payload.username) | (User.email == payload.email))
        .first()
    )

    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user = User(
        username=payload.username,
        email=payload.email,
        password=hash_password(payload.password),
        role="student",
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/admin-login", response_model=TokenResponse)
def admin_login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()

    if not user or user.role != "admin" or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid admin credentials")

    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/gmail-login", response_model=TokenResponse)
def gmail_login(payload: GmailLoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not email.endswith("@gmail.com"):
        raise HTTPException(status_code=400, detail="Use a valid Gmail address")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        base_username = (payload.name or email.split("@")[0]).replace(" ", "").lower()
        if not base_username:
            base_username = "gmailuser"

        username = base_username
        suffix = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{suffix}"
            suffix += 1

        user = User(
            username=username,
            email=email,
            password=hash_password(uuid.uuid4().hex),
            role="student",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/admin-gmail-login", response_model=TokenResponse)
def admin_gmail_login(payload: GmailLoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Use a valid email address")

    if not _is_allowed_admin_google_email(email):
        raise HTTPException(
            status_code=403,
            detail="This email is not allowed for admin login. Add it to ADMIN_GMAILS/ADMIN_EMAIL.",
        )

    user = _resolve_admin_user(email, db)
    if not user:
        raise HTTPException(
            status_code=403,
            detail="No admin account found. Check ADMIN_USERNAME/ADMIN_EMAIL and restart backend.",
        )

    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/admin-google-login", response_model=TokenResponse)
def admin_google_login(payload: GoogleTokenLoginRequest, db: Session = Depends(get_db)):
    token_info = _verify_google_id_token(payload.id_token)
    email = str(token_info.get("email", "")).strip().lower()

    if not _is_allowed_admin_google_email(email):
        raise HTTPException(
            status_code=403,
            detail="This email is not allowed for admin login. Add it to ADMIN_GMAILS/ADMIN_EMAIL.",
        )

    user = _resolve_admin_user(email, db)
    if not user:
        raise HTTPException(
            status_code=403,
            detail="No admin account found. Check ADMIN_USERNAME/ADMIN_EMAIL and restart backend.",
        )

    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}