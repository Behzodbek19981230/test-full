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

    topics = db.query(Topic).filter(
        Topic.subject_id == subject_id, Topic.is_active == True
    ).all()

    if not topics:
        raise HTTPException(status_code=404, detail="Bu fanda mavzular topilmadi")

    mixed_topics = [t for t in topics if t.is_mixed]
    non_mixed = [t for t in topics if not t.is_mixed]

    all_questions = []

    if non_mixed:
        per_topic = max(1, count // len(non_mixed))
        remainder = count - per_topic * len(non_mixed)

        for i, t in enumerate(non_mixed):
            t_count = per_topic + (1 if i < remainder else 0)
            t_questions = db.query(Question).filter(
                Question.topic_id == t.id
            ).order_by(func.random()).limit(t_count).all()
            all_questions.extend(t_questions)

    if mixed_topics:
        mixed_ids = [t.id for t in mixed_topics]
        needed = count - len(all_questions)
        if needed > 0:
            mixed_questions = db.query(Question).filter(
                Question.topic_id.in_(mixed_ids)
            ).order_by(func.random()).limit(needed).all()
            all_questions.extend(mixed_questions)

    if not all_questions:
        topic_ids = [t.id for t in topics]
        all_questions = db.query(Question).filter(
            Question.topic_id.in_(topic_ids)
        ).order_by(func.random()).limit(count).all()

    if not all_questions:
        raise HTTPException(status_code=404, detail="Bu fanda savollar topilmadi")

    import random
    random.shuffle(all_questions)

    return {
        "subject": {"id": subject.id, "name": subject.name, "icon": subject.icon},
        "total": len(all_questions),
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
            }
            for q in all_questions
        ],
    }


@router.get("/mandatory/generate")
def generate_mandatory_quiz(db: Session = Depends(get_db)):
    mandatory_subjects = db.query(Subject).filter(
        Subject.is_mandatory == True, Subject.is_active == True
    ).all()

    if not mandatory_subjects:
        raise HTTPException(status_code=404, detail="Majburiy fanlar topilmadi")

    all_questions = []
    subjects_info = []

    for subj in mandatory_subjects:
        count = subj.mandatory_question_count or 10
        topic_ids = [t.id for t in db.query(Topic.id).filter(
            Topic.subject_id == subj.id, Topic.is_active == True
        ).all()]

        if not topic_ids:
            continue

        questions = db.query(Question).filter(
            Question.topic_id.in_(topic_ids)
        ).order_by(func.random()).limit(count).all()

        subjects_info.append({
            "id": subj.id, "name": subj.name, "icon": subj.icon,
            "question_count": len(questions),
        })

        for q in questions:
            all_questions.append({
                "id": q.id,
                "subject_id": subj.id,
                "subject_name": subj.name,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
            })

    if not all_questions:
        raise HTTPException(status_code=404, detail="Majburiy fanlarda savollar topilmadi")

    return {
        "subject": {"id": 0, "name": "Majburiy fanlar", "icon": "📋"},
        "subjects": subjects_info,
        "total": len(all_questions),
        "questions": all_questions,
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
