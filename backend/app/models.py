from datetime import datetime, timezone
from app import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    telegram_id = db.Column(db.BigInteger, unique=True, nullable=True)
    username = db.Column(db.String(100), nullable=True)
    full_name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    role = db.Column(db.String(20), default='student')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    payments = db.relationship('Payment', backref='user', lazy='dynamic', foreign_keys='Payment.user_id')
    attempts = db.relationship('TestAttempt', backref='user', lazy='dynamic')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'telegram_id': self.telegram_id,
            'username': self.username,
            'full_name': self.full_name,
            'phone': self.phone,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Admin(db.Model):
    __tablename__ = 'admins'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Subject(db.Model):
    __tablename__ = 'subjects'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.Text, default='📚')
    price_per_question = db.Column(db.Integer, default=500)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    topics = db.relationship('Topic', backref='subject', lazy='dynamic', order_by='Topic.order_num')

    def to_dict(self):
        topic_list = self.topics.filter_by(is_active=True).all()
        total_questions = sum(t.questions.count() for t in topic_list)
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'price_per_question': self.price_per_question,
            'is_active': self.is_active,
            'topic_count': len(topic_list),
            'question_count': total_questions,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Topic(db.Model):
    __tablename__ = 'topics'

    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    name = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    order_num = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    questions = db.relationship('Question', backref='topic', lazy='dynamic', order_by='Question.order_num')

    def to_dict(self, include_questions=False):
        data = {
            'id': self.id,
            'subject_id': self.subject_id,
            'name': self.name,
            'description': self.description,
            'order_num': self.order_num,
            'is_active': self.is_active,
            'question_count': self.questions.count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_questions:
            data['questions'] = [q.to_dict() for q in self.questions.order_by(Question.order_num).all()]
        return data


class Question(db.Model):
    __tablename__ = 'questions'

    id = db.Column(db.Integer, primary_key=True)
    topic_id = db.Column(db.Integer, db.ForeignKey('topics.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.Text, nullable=False)
    option_b = db.Column(db.Text, nullable=False)
    option_c = db.Column(db.Text, nullable=False)
    option_d = db.Column(db.Text, nullable=False)
    correct_option = db.Column(db.String(1), nullable=False)
    order_num = db.Column(db.Integer, default=0)

    answers = db.relationship('AttemptAnswer', backref='question', lazy='dynamic')

    def to_dict(self, hide_answer=False):
        data = {
            'id': self.id,
            'topic_id': self.topic_id,
            'topic_name': self.topic.name if self.topic else None,
            'question_text': self.question_text,
            'option_a': self.option_a,
            'option_b': self.option_b,
            'option_c': self.option_c,
            'option_d': self.option_d,
            'order_num': self.order_num,
        }
        if not hide_answer:
            data['correct_option'] = self.correct_option
        return data


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    question_count = db.Column(db.Integer, nullable=False, default=30)
    mode = db.Column(db.String(20), default='mixed')  # mixed, topics
    amount = db.Column(db.Integer, nullable=False)
    screenshot_file_id = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), default='pending')
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=True)
    admin_note = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    subject = db.relationship('Subject', backref='payments')
    admin = db.relationship('Admin', backref='processed_payments')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'question_count': self.question_count,
            'mode': self.mode,
            'amount': self.amount,
            'screenshot_file_id': self.screenshot_file_id,
            'status': self.status,
            'admin_id': self.admin_id,
            'admin_note': self.admin_note,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class TestAttempt(db.Model):
    __tablename__ = 'test_attempts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    payment_id = db.Column(db.Integer, db.ForeignKey('payments.id'), nullable=True)
    mode = db.Column(db.String(20), default='mixed')
    started_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    finished_at = db.Column(db.DateTime, nullable=True)
    score = db.Column(db.Float, default=0)
    total_questions = db.Column(db.Integer, default=0)
    correct_answers = db.Column(db.Integer, default=0)

    subject = db.relationship('Subject', backref='attempts')
    payment = db.relationship('Payment', backref='attempt')
    answers = db.relationship('AttemptAnswer', backref='attempt', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'mode': self.mode,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'finished_at': self.finished_at.isoformat() if self.finished_at else None,
            'score': self.score,
            'total_questions': self.total_questions,
            'correct_answers': self.correct_answers,
        }


class AttemptAnswer(db.Model):
    __tablename__ = 'attempt_answers'

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(db.Integer, db.ForeignKey('test_attempts.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'), nullable=False)
    selected_option = db.Column(db.String(1), nullable=True)
    is_correct = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'attempt_id': self.attempt_id,
            'question_id': self.question_id,
            'question_text': self.question.question_text if self.question else None,
            'selected_option': self.selected_option,
            'correct_option': self.question.correct_option if self.question else None,
            'is_correct': self.is_correct,
        }


class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='info')
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    admin = db.relationship('Admin', backref='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'admin_id': self.admin_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('admins.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    entity_type = db.Column(db.String(50), nullable=True)
    entity_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    admin = db.relationship('Admin', backref='audit_logs')

    @staticmethod
    def log(admin_id, action, entity_type=None, entity_id=None, details=None, ip_address=None):
        from app import db as _db
        entry = AuditLog(
            admin_id=admin_id, action=action, entity_type=entity_type,
            entity_id=entity_id, details=details, ip_address=ip_address,
        )
        _db.session.add(entry)
        _db.session.commit()

    def to_dict(self):
        return {
            'id': self.id,
            'admin_id': self.admin_id,
            'admin_name': self.admin.full_name if self.admin else 'System',
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
