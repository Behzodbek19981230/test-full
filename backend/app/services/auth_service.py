from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from app.models.admin import Admin


def authenticate_admin(db: Session, username: str, password: str) -> Admin | None:
    admin = db.query(Admin).filter(Admin.username == username).first()
    if not admin or not bcrypt.verify(password, admin.password_hash):
        return None
    return admin


def change_password(db: Session, admin: Admin, old_password: str, new_password: str) -> bool:
    if not bcrypt.verify(old_password, admin.password_hash):
        return False
    admin.password_hash = bcrypt.hash(new_password)
    db.commit()
    return True


def ensure_default_admin(db: Session, username: str, password: str):
    if db.query(Admin).first():
        return
    admin = Admin(
        username=username,
        password_hash=bcrypt.hash(password),
        full_name="Administrator",
    )
    db.add(admin)
    db.commit()
    print(f"Default admin yaratildi: {username} / {password}")
