from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models import AuditLog, Notification
from app import db

bp = Blueprint('audit', __name__, url_prefix='/api')


@bp.route('/audit-logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    pagination = AuditLog.query.order_by(AuditLog.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'logs': [log.to_dict() for log in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    })


@bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    unread_only = request.args.get('unread_only', 'false') == 'true'

    query = Notification.query.filter(Notification.admin_id.isnot(None))
    if unread_only:
        query = query.filter_by(is_read=False)

    pagination = query.order_by(Notification.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'notifications': [n.to_dict() for n in pagination.items],
        'total': pagination.total,
        'unread_count': Notification.query.filter(
            Notification.admin_id.isnot(None), Notification.is_read == False
        ).count(),
    })


@bp.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_read(notification_id):
    notification = Notification.query.get_or_404(notification_id)
    notification.is_read = True
    db.session.commit()
    return jsonify(notification.to_dict())


@bp.route('/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    Notification.query.filter(
        Notification.admin_id.isnot(None), Notification.is_read == False
    ).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'Barcha bildirishnomalar o\'qildi'})
