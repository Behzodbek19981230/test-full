from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(Text, default="📚")
    price_per_question = Column(Integer, default=500)
    is_active = Column(Boolean, default=True)
    is_free = Column(Boolean, default=False)
    is_mandatory = Column(Boolean, default=False)
    mandatory_question_count = Column(Integer, default=10)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    topics = relationship("Topic", back_populates="subject", order_by="Topic.order_num")
