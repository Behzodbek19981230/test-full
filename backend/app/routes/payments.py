from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, socketio
from app.models import Payment, Notification, AuditLog

bp = Blueprint('payments', __name__, url_prefix='/api/payments')


@bp.route('', methods=['GET'])
@jwt_required()
def get_payments():
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Payment.query
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(Payment.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'payments': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
    })


@bp.route('/pending/count', methods=['GET'])
@jwt_required()
def pending_count():
    count = Payment.query.filter_by(status='pending').count()
    return jsonify({'count': count})


@bp.route('/<int:payment_id>/approve', methods=['PUT'])
@jwt_required()
def approve_payment(payment_id):
    admin_id = int(get_jwt_identity())
    payment = Payment.query.get_or_404(payment_id)

    if payment.status != 'pending':
        return jsonify({'error': 'Bu to\'lov allaqachon ko\'rib chiqilgan'}), 400

    payment.status = 'approved'
    payment.admin_id = admin_id
    payment.admin_note = request.get_json().get('note', '')

    notification = Notification(
        user_id=payment.user_id,
        admin_id=admin_id,
        title='To\'lov tasdiqlandi',
        message=f'"{payment.subject.name}" fani uchun {payment.question_count} ta test to\'lovingiz tasdiqlandi. Botda testni boshlashingiz mumkin!',
        type='payment',
    )
    db.session.add(notification)
    db.session.commit()

    AuditLog.log(admin_id, 'approve', 'payment', payment.id,
                 f'To\'lov tasdiqlandi: {payment.amount} so\'m', request.remote_addr)

    socketio.emit('payment_updated', payment.to_dict())
    socketio.emit('notification', notification.to_dict())

    return jsonify(payment.to_dict())


@bp.route('/<int:payment_id>/reject', methods=['PUT'])
@jwt_required()
def reject_payment(payment_id):
    admin_id = int(get_jwt_identity())
    payment = Payment.query.get_or_404(payment_id)

    if payment.status != 'pending':
        return jsonify({'error': 'Bu to\'lov allaqachon ko\'rib chiqilgan'}), 400

    payment.status = 'rejected'
    payment.admin_id = admin_id
    payment.admin_note = request.get_json().get('note', 'To\'lov rad etildi')

    notification = Notification(
        user_id=payment.user_id,
        admin_id=admin_id,
        title='To\'lov rad etildi',
        message=f'"{payment.subject.name}" fani uchun to\'lovingiz rad etildi. Sabab: {payment.admin_note}',
        type='payment',
    )
    db.session.add(notification)
    db.session.commit()

    AuditLog.log(admin_id, 'reject', 'payment', payment.id,
                 f'To\'lov rad etildi: {payment.amount} so\'m', request.remote_addr)

    socketio.emit('payment_updated', payment.to_dict())

    return jsonify(payment.to_dict())
