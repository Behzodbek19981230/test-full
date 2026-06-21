from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class TestVariant(Base):
    __tablename__ = "test_variants"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    question_count = Column(Integer, default=30)
    status = Column(String(20), default="pending", index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    sent_at = Column(DateTime, nullable=True)
    error_log = Column(Text, nullable=True)

    payment = relationship("Payment")
    user = relationship("User")
    subject = relationship("Subject")
