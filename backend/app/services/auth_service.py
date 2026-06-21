import bcrypt
from sqlalchemy.orm import Session
from app.models.admin import Admin


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def authenticate_admin(db: Session, username: str, password: str) -> Admin | None:
    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin or not _verify_password(password, admin.password_hash):
        return None
    return admin


def change_password(db: Session, admin: Admin, old_password: str, new_password: str) -> bool:
    if not _verify_password(old_password, admin.password_hash):
        return False
    admin.password_hash = _hash_password(new_password)
    db.commit()
    return True


def ensure_default_admin(db: Session, username: str, password: str):
    if db.query(Admin).first():
        return
    admin = Admin(
        username=username,
        password_hash=_hash_password(password),
        full_name="Administrator",
        role="superadmin",
    )
    db.add(admin)
    db.commit()
    print(f"Default admin yaratildi: {username} / {password}")
