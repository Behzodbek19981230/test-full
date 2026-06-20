from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Topic, Question, AuditLog

bp = Blueprint('topics', __name__, url_prefix='/api/topics')


@bp.route('', methods=['GET'])
def get_topics():
    subject_id = request.args.get('subject_id', type=int)
    if not subject_id:
        return jsonify({'error': 'subject_id kerak'}), 400
    topics = Topic.query.filter_by(subject_id=subject_id, is_active=True).order_by(Topic.order_num).all()
    return jsonify([t.to_dict() for t in topics])


@bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_topics():
    subject_id = request.args.get('subject_id', type=int)
    query = Topic.query
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    topics = query.order_by(Topic.subject_id, Topic.order_num).all()
    return jsonify([t.to_dict() for t in topics])


@bp.route('/<int:topic_id>', methods=['GET'])
@jwt_required()
def get_topic(topic_id):
    topic = Topic.query.get_or_404(topic_id)
    return jsonify(topic.to_dict(include_questions=True))


@bp.route('', methods=['POST'])
@jwt_required()
def create_topic():
    admin_id = int(get_jwt_identity())
    data = request.get_json()

    max_order = db.session.query(db.func.coalesce(db.func.max(Topic.order_num), 0)).filter_by(
        subject_id=data['subject_id']
    ).scalar()

    topic = Topic(
        subject_id=data['subject_id'],
        name=data['name'],
        description=data.get('description', ''),
        order_num=max_order + 1,
    )
    db.session.add(topic)
    db.session.commit()

    AuditLog.log(admin_id, 'create', 'topic', topic.id,
                 f'Mavzu yaratildi: {topic.name}', request.remote_addr)

    return jsonify(topic.to_dict()), 201


@bp.route('/<int:topic_id>', methods=['PUT'])
@jwt_required()
def update_topic(topic_id):
    admin_id = int(get_jwt_identity())
    topic = Topic.query.get_or_404(topic_id)
    data = request.get_json()

    topic.name = data.get('name', topic.name)
    topic.description = data.get('description', topic.description)
    topic.order_num = data.get('order_num', topic.order_num)
    topic.is_active = data.get('is_active', topic.is_active)
    db.session.commit()

    AuditLog.log(admin_id, 'update', 'topic', topic.id,
                 f'Mavzu yangilandi: {topic.name}', request.remote_addr)

    return jsonify(topic.to_dict())


@bp.route('/<int:topic_id>', methods=['DELETE'])
@jwt_required()
def delete_topic(topic_id):
    admin_id = int(get_jwt_identity())
    topic = Topic.query.get_or_404(topic_id)
    topic.is_active = False
    db.session.commit()

    AuditLog.log(admin_id, 'delete', 'topic', topic.id,
                 f'Mavzu o\'chirildi: {topic.name}', request.remote_addr)

    return jsonify({'message': 'Mavzu o\'chirildi'})


@bp.route('/<int:topic_id>/questions', methods=['GET'])
@jwt_required()
def get_questions(topic_id):
    topic = Topic.query.get_or_404(topic_id)
    questions = Question.query.filter_by(topic_id=topic_id).order_by(Question.order_num).all()
    return jsonify({
        'topic': topic.to_dict(),
        'questions': [q.to_dict() for q in questions],
    })


@bp.route('/<int:topic_id>/questions', methods=['POST'])
@jwt_required()
def add_question(topic_id):
    admin_id = int(get_jwt_identity())
    Topic.query.get_or_404(topic_id)
    data = request.get_json()

    max_order = db.session.query(db.func.coalesce(db.func.max(Question.order_num), 0)).filter_by(
        topic_id=topic_id
    ).scalar()

    question = Question(
        topic_id=topic_id,
        question_text=data['question_text'],
        option_a=data['option_a'],
        option_b=data['option_b'],
        option_c=data['option_c'],
        option_d=data['option_d'],
        correct_option=data['correct_option'].upper(),
        order_num=max_order + 1,
    )
    db.session.add(question)
    db.session.commit()

    AuditLog.log(admin_id, 'create', 'question', question.id,
                 f'Savol qo\'shildi (mavzu #{topic_id})', request.remote_addr)

    return jsonify(question.to_dict()), 201


@bp.route('/<int:topic_id>/questions/bulk', methods=['POST'])
@jwt_required()
def add_questions_bulk(topic_id):
    admin_id = int(get_jwt_identity())
    Topic.query.get_or_404(topic_id)
    data = request.get_json()
    questions_data = data.get('questions', [])

    max_order = db.session.query(db.func.coalesce(db.func.max(Question.order_num), 0)).filter_by(
        topic_id=topic_id
    ).scalar()

    added = 0
    for i, q in enumerate(questions_data):
        question = Question(
            topic_id=topic_id,
            question_text=q['question_text'],
            option_a=q['option_a'],
            option_b=q['option_b'],
            option_c=q['option_c'],
            option_d=q['option_d'],
            correct_option=q['correct_option'].upper(),
            order_num=max_order + i + 1,
        )
        db.session.add(question)
        added += 1

    db.session.commit()

    AuditLog.log(admin_id, 'create', 'question', topic_id,
                 f'{added} ta savol qo\'shildi (mavzu #{topic_id})', request.remote_addr)

    return jsonify({'added': added}), 201


@bp.route('/questions/<int:question_id>', methods=['PUT'])
@jwt_required()
def update_question(question_id):
    admin_id = int(get_jwt_identity())
    q = Question.query.get_or_404(question_id)
    data = request.get_json()

    q.question_text = data.get('question_text', q.question_text)
    q.option_a = data.get('option_a', q.option_a)
    q.option_b = data.get('option_b', q.option_b)
    q.option_c = data.get('option_c', q.option_c)
    q.option_d = data.get('option_d', q.option_d)
    q.correct_option = data.get('correct_option', q.correct_option).upper()
    db.session.commit()

    AuditLog.log(admin_id, 'update', 'question', q.id,
                 f'Savol yangilandi #{q.id}', request.remote_addr)

    return jsonify(q.to_dict())


@bp.route('/questions/<int:question_id>', methods=['DELETE'])
@jwt_required()
def delete_question(question_id):
    admin_id = int(get_jwt_identity())
    q = Question.query.get_or_404(question_id)
    db.session.delete(q)
    db.session.commit()

    AuditLog.log(admin_id, 'delete', 'question', question_id,
                 f'Savol o\'chirildi #{question_id}', request.remote_addr)

    return jsonify({'message': 'Savol o\'chirildi'})
