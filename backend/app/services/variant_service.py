import threading
from sqlalchemy.orm import Session
from app.models.variant import TestVariant
from app.models.question import Question
from app.services.pdf_service import generate_and_send


def _to_dict(v: TestVariant) -> dict:
    return {
        "id": v.id,
        "payment_id": v.payment_id,
        "user_id": v.user_id,
        "user": {
            "full_name": v.user.full_name,
            "username": v.user.username,
            "telegram_id": v.user.telegram_id,
        } if v.user else None,
        "subject_name": v.subject.name if v.subject else None,
        "question_count": v.question_count,
        "status": v.status,
        "user_answers": v.user_answers,
        "correct_count": v.correct_count,
        "score": v.score,
        "error_log": v.error_log,
        "created_at": v.created_at.isoformat() if v.created_at else None,
        "sent_at": v.sent_at.isoformat() if v.sent_at else None,
        "checked_at": v.checked_at.isoformat() if v.checked_at else None,
    }


def get_variants(db: Session, status: str = None, page: int = 1, per_page: int = 20) -> dict:
    query = db.query(TestVariant)
    if status:
        query = query.filter(TestVariant.status == status)
    total = query.count()
    variants = query.order_by(TestVariant.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "variants": [_to_dict(v) for v in variants],
        "total": total,
        "pages": (total + per_page - 1) // per_page,
        "current_page": page,
    }


def get_detail(db: Session, variant_id: int) -> dict | None:
    v = db.query(TestVariant).filter(TestVariant.id == variant_id).first()
    if not v:
        return None

    result = _to_dict(v)
    result["questions"] = []

    if v.question_ids:
        q_ids = [int(qid) for qid in v.question_ids.split(",")]
        questions_map = {q.id: q for q in db.query(Question).filter(Question.id.in_(q_ids)).all()}
        user_ans = v.user_answers or ""

        for i, qid in enumerate(q_ids):
            q = questions_map.get(qid)
            if not q:
                continue
            ua = user_ans[i] if i < len(user_ans) else None
            result["questions"].append({
                "num": i + 1,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
                "correct_option": q.correct_option.upper(),
                "user_answer": ua,
                "is_correct": ua == q.correct_option.upper() if ua else None,
            })

    return result


def update_status(db: Session, variant_id: int, new_status: str) -> dict | None:
    v = db.query(TestVariant).filter(TestVariant.id == variant_id).first()
    if not v:
        return None
    v.status = new_status
    db.commit()
    db.refresh(v)
    return _to_dict(v)


def resend(db: Session, variant_id: int) -> dict | None:
    v = db.query(TestVariant).filter(TestVariant.id == variant_id).first()
    if not v:
        return None

    telegram_id = v.user.telegram_id if v.user else None
    if not telegram_id:
        v.status = "failed"
        v.error_log = "Foydalanuvchida telegram_id yo'q"
        db.commit()
        db.refresh(v)
        return _to_dict(v)

    v.status = "pending"
    v.error_log = None
    db.commit()
    db.refresh(v)

    subject_name = v.subject.name if v.subject else "Test"
    vid = v.id
    sid = v.subject_id
    qcount = v.question_count

    threading.Thread(
        target=generate_and_send,
        args=(vid, telegram_id, subject_name, sid, qcount),
        daemon=True,
    ).start()

    return _to_dict(v)
