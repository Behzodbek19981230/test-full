import os
import threading
from app import create_app, db, socketio
from app.models import Admin
from werkzeug.security import generate_password_hash


app = create_app()


def init_db():
    with app.app_context():
        db.create_all()
        if not Admin.query.first():
            admin = Admin(
                username=os.getenv('ADMIN_USERNAME', 'admin'),
                password_hash=generate_password_hash(os.getenv('ADMIN_PASSWORD', 'admin123')),
                full_name='Administrator',
            )
            db.session.add(admin)
            db.session.commit()
            print('Default admin yaratildi: admin / admin123')


def start_bot():
    from app.bot import run_bot
    run_bot(app)


if __name__ == '__main__':
    init_db()

    bot_thread = threading.Thread(target=start_bot, daemon=True)
    bot_thread.start()
    print('Telegram bot ishga tushdi!')

    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False, allow_unsafe_werkzeug=True)
