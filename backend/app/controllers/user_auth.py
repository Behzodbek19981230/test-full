"""Public user authentication: Google OAuth, Telegram Login, Phone+Password."""

import hashlib
import hmac
import re
import bcrypt
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.database import get_db
from app.dependencies import create_user_token, get_current_user
from app.models.user import User
from app.config import get_settings

router = APIRouter(prefix="/user-auth", tags=["user-auth"])


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


class GoogleLoginRequest(BaseModel):
    credential: str


class TelegramLoginRequest(BaseModel):
    id: int
    first_name: str
    last_name: str | None = None
    username: str | None = None
    photo_url: str | None = None
    auth_date: int
    hash: str


class PhoneRegisterRequest(BaseModel):
    first_name: str
    last_name: str
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^\+?\d{9,15}$", cleaned):
            raise ValueError("Telefon raqam noto'g'ri formatda")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
        return v


class PhoneLoginRequest(BaseModel):
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return re.sub(r"[\s\-\(\)]", "", v)


def _user_response(user: User, token: str) -> dict:
    return {
        "token": token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "avatar": user.avatar,
            "username": user.username,
            "telegram_id": user.telegram_id,
        },
    }


@router.post("/google")
def google_login(body: GoogleLoginRequest, db: Session = Depends(get_db)):
    settings = get_settings()
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Client ID sozlanmagan")

    try:
        idinfo = id_token.verify_oauth2_token(
            body.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Google token yaroqsiz")

    google_id = idinfo["sub"]
    email = idinfo.get("email", "")
    name = idinfo.get("name", email.split("@")[0])
    picture = idinfo.get("picture", "")

    # Find by google_id or email
    user = db.query(User).filter(User.google_id == google_id).first()
    if not user and email:
        user = db.query(User).filter(User.email == email).first()

    if user:
        user.google_id = google_id
        if picture:
            user.avatar = picture
        if not user.full_name or user.full_name == "Foydalanuvchi":
            user.full_name = name
        db.commit()
    else:
        user = User(
            google_id=google_id,
            email=email,
            full_name=name,
            avatar=picture,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_user_token(user.id)
    return _user_response(user, token)


@router.post("/telegram")
def telegram_login(body: TelegramLoginRequest, db: Session = Depends(get_db)):
    settings = get_settings()
    bot_token = settings.TELEGRAM_BOT_TOKEN
    if not bot_token:
        raise HTTPException(status_code=500, detail="Bot token sozlanmagan")

    # Verify Telegram hash
    check_data = "\n".join(
        f"{k}={v}" for k, v in sorted(body.model_dump(exclude={"hash"}).items())
        if v is not None
    )
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    computed_hash = hmac.new(secret_key, check_data.encode(), hashlib.sha256).hexdigest()

    if computed_hash != body.hash:
        raise HTTPException(status_code=401, detail="Telegram ma'lumotlari yaroqsiz")

    full_name = body.first_name
    if body.last_name:
        full_name += f" {body.last_name}"

    user = db.query(User).filter(User.telegram_id == body.id).first()
    if user:
        if body.username:
            user.username = body.username
        if body.photo_url:
            user.avatar = body.photo_url
        user.full_name = full_name
        db.commit()
    else:
        user = User(
            telegram_id=body.id,
            username=body.username or "",
            full_name=full_name,
            avatar=body.photo_url,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_user_token(user.id)
    return _user_response(user, token)


@router.post("/register")
def phone_register(body: PhoneRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.phone == body.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu telefon raqam allaqachon ro'yxatdan o'tgan")

    user = User(
        full_name=f"{body.first_name} {body.last_name}".strip(),
        phone=body.phone,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_user_token(user.id)
    return _user_response(user, token)


@router.post("/login")
def phone_login(body: PhoneLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == body.phone).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Telefon raqam yoki parol noto'g'ri")

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Telefon raqam yoki parol noto'g'ri")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Hisob faol emas")

    token = create_user_token(user.id)
    return _user_response(user, token)


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "avatar": user.avatar,
        "username": user.username,
        "telegram_id": user.telegram_id,
    }
