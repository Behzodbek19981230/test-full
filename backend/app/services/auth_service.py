import bcrypt
from sqlalchemy.orm import Session
from app.models.user import User


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def authenticate_admin(db: Session, login: str, password: str) -> User | None:
    user = db.query(User).filter(User.login == login).first()
    if not user or not user.password_hash or not _verify_password(password, user.password_hash):
        return None
    return user


def change_password(db: Session, user: User, old_password: str, new_password: str) -> bool:
    if not user.password_hash or not _verify_password(old_password, user.password_hash):
        return False
    user.password_hash = _hash_password(new_password)
    db.commit()
    return True


def ensure_default_admin(db: Session, username: str, password: str):
    if db.query(User).filter(User.role.in_(["admin", "superadmin"])).first():
        return
    admin = User(
        login=username,
        password_hash=_hash_password(password),
        full_name="Administrator",
        role="superadmin",
    )
    db.add(admin)
    db.commit()
    print(f"Default admin yaratildi: {username} / {password}")
