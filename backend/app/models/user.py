from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, Boolean, DateTime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, nullable=True, index=True)
    google_id = Column(String(100), unique=True, nullable=True, index=True)
    email = Column(String(200), unique=True, nullable=True, index=True)
    avatar = Column(String(500), nullable=True)
    login = Column(String(100), unique=True, nullable=True, index=True)
    password_hash = Column(String(256), nullable=True)
    username = Column(String(100), nullable=True)
    full_name = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), default="student")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
