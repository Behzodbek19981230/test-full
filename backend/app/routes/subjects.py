import os
import uuid
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db
from app.models import Subject, AuditLog

ALLOWED_EXTENSIONS = {'svg', 'png', 'jpg', 'jpeg', 'webp'}

bp = Blueprint('subjects', __name__, url_prefix='/api/subjects')


@bp.route('', methods=['GET'])
def get_subjects():
    subjects = Subject.query.filter_by(is_active=True).all()
    return jsonify([s.to_dict() for s in subjects])


@bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_subjects():
    subjects = Subject.query.order_by(Subject.created_at.desc()).all()
    return jsonify([s.to_dict() for s in subjects])


@bp.route('/<int:subject_id>', methods=['GET'])
def get_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    return jsonify(subject.to_dict())


@bp.route('', methods=['POST'])
@jwt_required()
def create_subject():
    admin_id = int(get_jwt_identity())
    data = request.get_json()

    subject = Subject(
        name=data['name'],
        description=data.get('description', ''),
        icon=data.get('icon', '📚'),
    )
    db.session.add(subject)
    db.session.commit()

    AuditLog.log(admin_id, 'create', 'subject', subject.id,
                 f'Fan yaratildi: {subject.name}', request.remote_addr)

    return jsonify(subject.to_dict()), 201


@bp.route('/<int:subject_id>', methods=['PUT'])
@jwt_required()
def update_subject(subject_id):
    admin_id = int(get_jwt_identity())
    subject = Subject.query.get_or_404(subject_id)
    data = request.get_json()

    subject.name = data.get('name', subject.name)
    subject.description = data.get('description', subject.description)
    subject.icon = data.get('icon', subject.icon)
    subject.is_active = data.get('is_active', subject.is_active)
    db.session.commit()

    AuditLog.log(admin_id, 'update', 'subject', subject.id,
                 f'Fan yangilandi: {subject.name}', request.remote_addr)

    return jsonify(subject.to_dict())


@bp.route('/<int:subject_id>', methods=['DELETE'])
@jwt_required()
def delete_subject(subject_id):
    admin_id = int(get_jwt_identity())
    subject = Subject.query.get_or_404(subject_id)
    subject.is_active = False
    db.session.commit()

    AuditLog.log(admin_id, 'delete', 'subject', subject.id,
                 f'Fan o\'chirildi: {subject.name}', request.remote_addr)

    return jsonify({'message': 'Fan o\'chirildi'})


@bp.route('/upload-icon', methods=['POST'])
@jwt_required()
def upload_icon():
    if 'icon' not in request.files:
        return jsonify({'error': 'Fayl topilmadi'}), 400

    file = request.files['icon']
    if not file.filename:
        return jsonify({'error': 'Fayl nomi bo\'sh'}), 400

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({'error': f'Ruxsat etilmagan format. Faqat: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

    icons_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    filename = f'{uuid.uuid4().hex[:12]}.{ext}'
    filepath = os.path.join(icons_dir, filename)
    file.save(filepath)

    url = f'/api/uploads/icons/{filename}'
    return jsonify({'url': url, 'filename': filename})
