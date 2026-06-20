from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Test, Question, Subject, AuditLog

bp = Blueprint('tests', __name__, url_prefix='/api/tests')


@bp.route('', methods=['GET'])
def get_tests():
    subject_id = request.args.get('subject_id', type=int)
    query = Test.query.filter_by(is_active=True)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    tests = query.order_by(Test.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tests])


@bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_tests():
    subject_id = request.args.get('subject_id', type=int)
    query = Test.query
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    tests = query.order_by(Test.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tests])


@bp.route('/<int:test_id>', methods=['GET'])
def get_test(test_id):
    test = Test.query.get_or_404(test_id)
    return jsonify(test.to_dict(include_questions=False))


@bp.route('/<int:test_id>/questions', methods=['GET'])
@jwt_required()
def get_test_questions(test_id):
    test = Test.query.get_or_404(test_id)
    return jsonify(test.to_dict(include_questions=True))


@bp.route('', methods=['POST'])
@jwt_required()
def create_test():
    admin_id = int(get_jwt_identity())
    data = request.get_json()

    test = Test(
        subject_id=data['subject_id'],
        title=data['title'],
        description=data.get('description', ''),
        price=data.get('price', 0),
        duration_minutes=data.get('duration_minutes', 60),
    )
    db.session.add(test)
    db.session.flush()

    questions = data.get('questions', [])
    for i, q in enumerate(questions):
        question = Question(
            test_id=test.id,
            question_text=q['question_text'],
            option_a=q['option_a'],
            option_b=q['option_b'],
            option_c=q['option_c'],
            option_d=q['option_d'],
            correct_option=q['correct_option'].upper(),
            order_num=i + 1,
        )
        db.session.add(question)

    test.question_count = len(questions)
    db.session.commit()

    AuditLog.log(admin_id, 'create', 'test', test.id,
                 f'Test yaratildi: {test.title} ({len(questions)} savol)', request.remote_addr)

    return jsonify(test.to_dict(include_questions=True)), 201


@bp.route('/<int:test_id>', methods=['PUT'])
@jwt_required()
def update_test(test_id):
    admin_id = int(get_jwt_identity())
    test = Test.query.get_or_404(test_id)
    data = request.get_json()

    test.title = data.get('title', test.title)
    test.description = data.get('description', test.description)
    test.subject_id = data.get('subject_id', test.subject_id)
    test.price = data.get('price', test.price)
    test.duration_minutes = data.get('duration_minutes', test.duration_minutes)
    test.is_active = data.get('is_active', test.is_active)

    if 'questions' in data:
        Question.query.filter_by(test_id=test.id).delete()
        for i, q in enumerate(data['questions']):
            question = Question(
                test_id=test.id,
                question_text=q['question_text'],
                option_a=q['option_a'],
                option_b=q['option_b'],
                option_c=q['option_c'],
                option_d=q['option_d'],
                correct_option=q['correct_option'].upper(),
                order_num=i + 1,
            )
            db.session.add(question)
        test.question_count = len(data['questions'])

    db.session.commit()

    AuditLog.log(admin_id, 'update', 'test', test.id,
                 f'Test yangilandi: {test.title}', request.remote_addr)

    return jsonify(test.to_dict(include_questions=True))


@bp.route('/<int:test_id>', methods=['DELETE'])
@jwt_required()
def delete_test(test_id):
    admin_id = int(get_jwt_identity())
    test = Test.query.get_or_404(test_id)
    test.is_active = False
    db.session.commit()

    AuditLog.log(admin_id, 'delete', 'test', test.id,
                 f'Test o\'chirildi: {test.title}', request.remote_addr)

    return jsonify({'message': 'Test o\'chirildi'})
