from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*", async_mode='threading')


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])
    socketio.init_app(app)

    from app.routes import auth, subjects, topics, payments, stats, users, audit
    app.register_blueprint(auth.bp)
    app.register_blueprint(subjects.bp)
    app.register_blueprint(topics.bp)
    app.register_blueprint(payments.bp)
    app.register_blueprint(stats.bp)
    app.register_blueprint(users.bp)
    app.register_blueprint(audit.bp)

    from flask import send_from_directory
    import os
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    @app.route('/api/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    return app
