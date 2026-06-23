from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.topic import Topic
from app.models.question import Question


def _to_dict(topic: Topic, db: Session, include_questions: bool = False) -> dict:
    q_count = db.query(func.count(Question.id)).filter(Question.topic_id == topic.id).scalar()
    data = {
        "id": topic.id,
        "subject_id": topic.subject_id,
        "name": topic.name,
        "description": topic.description,
        "order_num": topic.order_num,
        "is_active": topic.is_active,
        "is_mixed": topic.is_mixed or False,
        "question_count": q_count or 0,
        "created_at": topic.created_at.isoformat() if topic.created_at else None,
    }
    if include_questions:
        questions = db.query(Question).filter(Question.topic_id == topic.id).order_by(Question.order_num).all()
        data["questions"] = [_q_dict(q) for q in questions]
    return data


def _q_dict(q: Question) -> dict:
    return {
        "id": q.id, "topic_id": q.topic_id, "question_text": q.question_text,
        "option_a": q.option_a, "option_b": q.option_b, "option_c": q.option_c, "option_d": q.option_d,
        "correct_option": q.correct_option, "order_num": q.order_num,
    }


def get_topics(db: Session, subject_id: int, active_only: bool = False) -> list[dict]:
    query = db.query(Topic).filter(Topic.subject_id == subject_id)
    if active_only:
        query = query.filter(Topic.is_active == True)
    return [_to_dict(t, db) for t in query.order_by(Topic.order_num).all()]


def get_topic_with_questions(db: Session, topic_id: int) -> dict | None:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        return None
    return _to_dict(topic, db, include_questions=True)


def create_topic(db: Session, data: dict) -> dict:
    max_order = db.query(func.coalesce(func.max(Topic.order_num), 0)).filter(
        Topic.subject_id == data["subject_id"]
    ).scalar()
    topic = Topic(**data, order_num=max_order + 1)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return _to_dict(topic, db)


def update_topic(db: Session, topic_id: int, data: dict) -> dict | None:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        return None
    for key, val in data.items():
        if val is not None:
            setattr(topic, key, val)
    db.commit()
    db.refresh(topic)
    return _to_dict(topic, db)


def delete_topic(db: Session, topic_id: int) -> bool:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        return False
    topic.is_active = False
    db.commit()
    return True


# ===== Questions =====

def add_question(db: Session, topic_id: int, data: dict) -> dict:
    max_order = db.query(func.coalesce(func.max(Question.order_num), 0)).filter(
        Question.topic_id == topic_id
    ).scalar()
    q = Question(topic_id=topic_id, **data, order_num=max_order + 1)
    q.correct_option = q.correct_option.upper()
    db.add(q)
    db.commit()
    db.refresh(q)
    return _q_dict(q)


def add_questions_bulk(db: Session, topic_id: int, questions_data: list[dict]) -> int:
    max_order = db.query(func.coalesce(func.max(Question.order_num), 0)).filter(
        Question.topic_id == topic_id
    ).scalar()
    for i, qd in enumerate(questions_data):
        q = Question(topic_id=topic_id, **qd, order_num=max_order + i + 1)
        q.correct_option = q.correct_option.upper()
        db.add(q)
    db.commit()
    return len(questions_data)


def update_question(db: Session, question_id: int, data: dict) -> dict | None:
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        return None
    for key, val in data.items():
        if val is not None:
            setattr(q, key, val if key != "correct_option" else val.upper())
    db.commit()
    db.refresh(q)
    return _q_dict(q)


def delete_question(db: Session, question_id: int) -> bool:
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        return False
    db.delete(q)
    db.commit()
    return True
