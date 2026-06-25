from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_admin
from app.models.attempt import TestAttempt, AttemptAnswer
from app.models.question import Question
from app.models.user import User

router = APIRouter(prefix="/attempts", tags=["attempts"])


def _to_dict(a: TestAttempt) -> dict:
    return {
        "id": a.id,
        "user": {
            "full_name": a.user.full_name,
            "username": a.user.username,
            "telegram_id": a.user.telegram_id,
            "email": a.user.email,
        } if a.user else None,
        "subject_name": a.subject.name if a.subject else None,
        "total_questions": a.total_questions,
        "correct_answers": a.correct_answers,
        "score": a.score,
        "started_at": a.started_at.isoformat() if a.started_at else None,
        "finished_at": a.finished_at.isoformat() if a.finished_at else None,
    }


@router.get("")
def get_attempts(page: int = 1, per_page: int = 20, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    query = db.query(TestAttempt)
    total = query.count()
    attempts = query.order_by(TestAttempt.started_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {
        "attempts": [_to_dict(a) for a in attempts],
        "total": total,
    }


@router.get("/{attempt_id}")
def get_attempt_detail(attempt_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    a = db.query(TestAttempt).filter(TestAttempt.id == attempt_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Topilmadi")

    result = _to_dict(a)
    aa_list = db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == a.id).all()
    q_ids = [aa.question_id for aa in aa_list]
    q_map = {q.id: q for q in db.query(Question).filter(Question.id.in_(q_ids)).all()} if q_ids else {}

    result["questions"] = []
    for i, aa in enumerate(aa_list):
        q = q_map.get(aa.question_id)
        if not q:
            continue
        result["questions"].append({
            "num": i + 1,
            "question_text": q.question_text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct_option": q.correct_option.upper(),
            "user_answer": aa.selected_option,
            "is_correct": aa.is_correct,
        })
    return result


@router.delete("/clear")
def clear_attempts(db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    db.query(AttemptAnswer).delete()
    count = db.query(TestAttempt).delete()
    db.commit()
    return {"deleted": count}
