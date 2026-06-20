from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.subject import Subject
from app.models.topic import Topic
from app.models.question import Question


def _enrich(subject: Subject, db: Session) -> dict:
    topics = db.query(Topic).filter(Topic.subject_id == subject.id, Topic.is_active == True).all()
    q_count = (
        db.query(func.count(Question.id))
        .join(Topic)
        .filter(Topic.subject_id == subject.id, Topic.is_active == True)
        .scalar()
    )
    return {
        "id": subject.id,
        "name": subject.name,
        "description": subject.description,
        "icon": subject.icon,
        "price_per_question": subject.price_per_question,
        "is_active": subject.is_active,
        "topic_count": len(topics),
        "question_count": q_count or 0,
        "created_at": subject.created_at.isoformat() if subject.created_at else None,
    }


def get_all(db: Session, active_only: bool = False) -> list[dict]:
    query = db.query(Subject)
    if active_only:
        query = query.filter(Subject.is_active == True)
    subjects = query.order_by(Subject.created_at.desc()).all()
    return [_enrich(s, db) for s in subjects]


def get_by_id(db: Session, subject_id: int) -> dict | None:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        return None
    return _enrich(subject, db)


def create(db: Session, data: dict) -> dict:
    subject = Subject(**data)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return _enrich(subject, db)


def update(db: Session, subject_id: int, data: dict) -> dict | None:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        return None
    for key, val in data.items():
        if val is not None:
            setattr(subject, key, val)
    db.commit()
    db.refresh(subject)
    return _enrich(subject, db)


def soft_delete(db: Session, subject_id: int) -> bool:
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        return False
    subject.is_active = False
    db.commit()
    return True
