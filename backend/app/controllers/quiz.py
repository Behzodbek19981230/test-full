"""Public quiz endpoint — generates random test for a subject."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.question import Question
from app.models.topic import Topic
from app.models.subject import Subject

router = APIRouter(prefix="/quiz", tags=["quiz"])


@router.get("/{subject_id}/generate")
def generate_quiz(subject_id: int, count: int = 30, db: Session = Depends(get_db)):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.is_active == True).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Fan topilmadi")

    topic_ids = [t.id for t in db.query(Topic.id).filter(
        Topic.subject_id == subject_id, Topic.is_active == True
    ).all()]

    if not topic_ids:
        raise HTTPException(status_code=404, detail="Bu fanda mavzular topilmadi")

    questions = db.query(Question).filter(
        Question.topic_id.in_(topic_ids)
    ).order_by(func.random()).limit(count).all()

    if not questions:
        raise HTTPException(status_code=404, detail="Bu fanda savollar topilmadi")

    return {
        "subject": {"id": subject.id, "name": subject.name, "icon": subject.icon},
        "total": len(questions),
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
            }
            for q in questions
        ],
    }


@router.post("/{subject_id}/check")
def check_quiz(subject_id: int, body: dict, db: Session = Depends(get_db)):
    """Check answers. Body: {"answers": {"question_id": "A", ...}}"""
    answers = body.get("answers", {})
    if not answers:
        raise HTTPException(status_code=400, detail="Javoblar bo'sh")

    question_ids = [int(qid) for qid in answers.keys()]
    questions = db.query(Question).filter(Question.id.in_(question_ids)).all()
    q_map = {q.id: q for q in questions}

    results = []
    correct_count = 0

    for qid_str, user_answer in answers.items():
        qid = int(qid_str)
        q = q_map.get(qid)
        if not q:
            continue
        is_correct = q.correct_option.upper() == user_answer.upper()
        if is_correct:
            correct_count += 1
        results.append({
            "id": q.id,
            "question_text": q.question_text,
            "option_a": q.option_a,
            "option_b": q.option_b,
            "option_c": q.option_c,
            "option_d": q.option_d,
            "correct_option": q.correct_option,
            "user_answer": user_answer.upper(),
            "is_correct": is_correct,
        })

    total = len(results)
    score = round((correct_count / total) * 100) if total > 0 else 0

    return {
        "total": total,
        "correct": correct_count,
        "incorrect": total - correct_count,
        "score": score,
        "results": results,
    }
