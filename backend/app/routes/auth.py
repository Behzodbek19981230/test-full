from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from app import db
from app.models import Admin, AuditLog

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')

    admin = Admin.query.filter_by(username=username).first()
    if not admin or not check_password_hash(admin.password_hash, password):
        return jsonify({'error': 'Noto\'g\'ri login yoki parol'}), 401

    token = create_access_token(identity=str(admin.id))

    AuditLog.log(admin.id, 'login', 'admin', admin.id, 'Admin tizimga kirdi', request.remote_addr)

    return jsonify({
        'token': token,
        'admin': admin.to_dict()
    })


@bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    admin_id = int(get_jwt_identity())
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({'error': 'Admin topilmadi'}), 404
    return jsonify(admin.to_dict())


@bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    admin_id = int(get_jwt_identity())
    admin = Admin.query.get(admin_id)
    data = request.get_json()

    if not check_password_hash(admin.password_hash, data.get('old_password', '')):
        return jsonify({'error': 'Eski parol noto\'g\'ri'}), 400

    admin.password_hash = generate_password_hash(data['new_password'])
    db.session.commit()

    return jsonify({'message': 'Parol muvaffaqiyatli o\'zgartirildi'})
