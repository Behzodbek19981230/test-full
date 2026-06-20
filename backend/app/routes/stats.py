from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from app import db
from app.models import User, Test, Payment, TestAttempt, Subject

bp = Blueprint('stats', __name__, url_prefix='/api/stats')


@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=30)
    week_ago = now - timedelta(days=7)

    total_users = User.query.count()
    new_users_month = User.query.filter(User.created_at >= month_ago).count()
    total_tests = Test.query.filter_by(is_active=True).count()
    total_attempts = TestAttempt.query.count()

    total_revenue = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).filter_by(status='approved').scalar()
    month_revenue = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
        Payment.status == 'approved', Payment.created_at >= month_ago
    ).scalar()

    pending_payments = Payment.query.filter_by(status='pending').count()

    avg_score = db.session.query(func.coalesce(func.avg(TestAttempt.score), 0)).scalar()

    daily_revenue = []
    for i in range(30):
        day = now - timedelta(days=29 - i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        revenue = db.session.query(func.coalesce(func.sum(Payment.amount), 0)).filter(
            Payment.status == 'approved',
            Payment.created_at >= day_start,
            Payment.created_at < day_end,
        ).scalar()
        daily_revenue.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'revenue': int(revenue),
        })

    daily_users = []
    for i in range(30):
        day = now - timedelta(days=29 - i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = User.query.filter(
            User.created_at >= day_start,
            User.created_at < day_end,
        ).count()
        daily_users.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'count': count,
        })

    subject_stats = []
    subjects = Subject.query.filter_by(is_active=True).all()
    for s in subjects:
        test_count = s.tests.filter_by(is_active=True).count()
        attempt_count = TestAttempt.query.join(Test).filter(Test.subject_id == s.id).count()
        subject_stats.append({
            'id': s.id,
            'name': s.name,
            'icon': s.icon,
            'test_count': test_count,
            'attempt_count': attempt_count,
        })

    return jsonify({
        'total_users': total_users,
        'new_users_month': new_users_month,
        'total_tests': total_tests,
        'total_attempts': total_attempts,
        'total_revenue': int(total_revenue),
        'month_revenue': int(month_revenue),
        'pending_payments': pending_payments,
        'avg_score': round(float(avg_score), 1),
        'daily_revenue': daily_revenue,
        'daily_users': daily_users,
        'subject_stats': subject_stats,
    })


@bp.route('/public', methods=['GET'])
def public_stats():
    total_users = User.query.count()
    total_tests = Test.query.filter_by(is_active=True).count()
    total_attempts = TestAttempt.query.count()
    total_subjects = Subject.query.filter_by(is_active=True).count()

    return jsonify({
        'total_users': total_users,
        'total_tests': total_tests,
        'total_attempts': total_attempts,
        'total_subjects': total_subjects,
    })
