from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from app.database import Base


class BotSettings(Base):
    __tablename__ = "bot_settings"

    id = Column(Integer, primary_key=True, index=True)
    channel_chat_id = Column(String(200), nullable=True)
    channel_title = Column(String(200), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Broadcast(Base):
    __tablename__ = "broadcasts"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    message = Column(Text, nullable=False)
    target = Column(String(20), nullable=False)  # users | channel | both
    status = Column(String(20), default="pending")  # pending | sent | failed
    media_path = Column(String(500), nullable=True)  # UPLOAD_DIR ga nisbatan yo'l
    media_type = Column(String(20), nullable=True)  # photo | animation
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
