from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from app.models import User, Payment, TestAttempt, Subject, Topic, Question


def get_dashboard(db: Session) -> dict:
    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=30)

    total_users = db.query(func.count(User.id)).scalar()
    new_users_month = db.query(func.count(User.id)).filter(User.created_at >= month_ago).scalar()
    total_questions = db.query(func.count(Question.id)).scalar()
    total_attempts = db.query(func.count(TestAttempt.id)).scalar()

    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.status == "approved").scalar()
    month_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.status == "approved", Payment.created_at >= month_ago
    ).scalar()
    pending_payments = db.query(func.count(Payment.id)).filter(Payment.status == "pending").scalar()
    avg_score = db.query(func.coalesce(func.avg(TestAttempt.score), 0)).scalar()

    daily_revenue = []
    daily_users = []
    for i in range(30):
        day = now - timedelta(days=29 - i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        rev = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
            Payment.status == "approved", Payment.created_at >= day_start, Payment.created_at < day_end
        ).scalar()
        daily_revenue.append({"date": day_start.strftime("%Y-%m-%d"), "revenue": int(rev)})

        cnt = db.query(func.count(User.id)).filter(User.created_at >= day_start, User.created_at < day_end).scalar()
        daily_users.append({"date": day_start.strftime("%Y-%m-%d"), "count": cnt})

    subject_stats = []
    for s in db.query(Subject).filter(Subject.is_active == True).all():
        topic_count = db.query(func.count(Topic.id)).filter(Topic.subject_id == s.id, Topic.is_active == True).scalar()
        q_count = db.query(func.count(Question.id)).join(Topic).filter(Topic.subject_id == s.id).scalar()
        attempt_count = db.query(func.count(TestAttempt.id)).filter(TestAttempt.subject_id == s.id).scalar()
        subject_stats.append({
            "id": s.id, "name": s.name, "icon": s.icon,
            "topic_count": topic_count, "question_count": q_count, "attempt_count": attempt_count,
        })

    return {
        "total_users": total_users, "new_users_month": new_users_month,
        "total_questions": total_questions, "total_attempts": total_attempts,
        "total_revenue": int(total_revenue), "month_revenue": int(month_revenue),
        "pending_payments": pending_payments, "avg_score": round(float(avg_score), 1),
        "daily_revenue": daily_revenue, "daily_users": daily_users, "subject_stats": subject_stats,
    }


def get_public(db: Session) -> dict:
    return {
        "total_users": db.query(func.count(User.id)).scalar(),
        "total_questions": db.query(func.count(Question.id)).scalar(),
        "total_attempts": db.query(func.count(TestAttempt.id)).scalar(),
        "total_subjects": db.query(func.count(Subject.id)).filter(Subject.is_active == True).scalar(),
    }
