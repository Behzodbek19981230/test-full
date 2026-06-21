"""Seeder: superadmin va admin rollarini yaratadi."""

from app.database import SessionLocal, engine, Base
from app.models.admin import Admin
from app.services.auth_service import _hash_password

SEED_USERS = [
    {
        "username": "superadmin",
        "password": "superadmin123",
        "full_name": "Super Administrator",
        "role": "superadmin",
    },
    {
        "username": "admin",
        "password": "admin123",
        "full_name": "Administrator",
        "role": "admin",
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for user_data in SEED_USERS:
            existing = db.query(Admin).filter(Admin.username == user_data["username"]).first()
            if existing:
                print(f"[SKIP] '{user_data['username']}' allaqachon mavjud")
                continue
            admin = Admin(
                username=user_data["username"],
                password_hash=_hash_password(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
            )
            db.add(admin)
            db.commit()
            print(f"[OK] '{user_data['username']}' ({user_data['role']}) yaratildi")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("\nSeeder tugadi!")
