from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    question_count = Column(Integer, nullable=False, default=30)
    mode = Column(String(20), default="mixed")
    amount = Column(Integer, nullable=False)
    screenshot_file_id = Column(String(500), nullable=True)
    status = Column(String(20), default="pending", index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    admin_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])
    subject = relationship("Subject")
    admin = relationship("User", foreign_keys=[admin_id])
