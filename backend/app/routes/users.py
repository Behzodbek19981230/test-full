from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import User, TestAttempt

bp = Blueprint('users', __name__, url_prefix='/api/users')


@bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')

    query = User.query
    if search:
        query = query.filter(
            db.or_(
                User.full_name.ilike(f'%{search}%'),
                User.username.ilike(f'%{search}%'),
                User.phone.ilike(f'%{search}%'),
            )
        )

    pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'users': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    })


@bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    attempts = TestAttempt.query.filter_by(user_id=user.id).order_by(TestAttempt.started_at.desc()).all()

    return jsonify({
        'user': user.to_dict(),
        'attempts': [a.to_dict() for a in attempts],
    })


@bp.route('/<int:user_id>/toggle-active', methods=['PUT'])
@jwt_required()
def toggle_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_active = not user.is_active
    db.session.commit()
    return jsonify(user.to_dict())
