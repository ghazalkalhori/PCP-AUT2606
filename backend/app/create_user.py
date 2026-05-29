import sys
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
os.chdir(BACKEND_DIR)
sys.path.insert(0, str(BACKEND_DIR))

from app.db import SessionLocal, engine, Base
from app.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

Base.metadata.create_all(bind=engine)

TEST_USERS = [
    {
        "username": "admin@reporta.ai",
        "password": "admin123",
        "role": "admin",
    },
    {
        "username": "ghazal@reporta.ai",
        "password": "admin123",
        "role": "admin",
    },
    {
        "username": "chris@reporta.ai",
        "password": "admin123",
        "role": "admin",
    },
]


def seed_users() -> None:
    db = SessionLocal()

    try:
        for user_data in TEST_USERS:
            existing_user = (
                db.query(User)
                .filter(User.username == user_data["username"])
                .first()
            )

            if existing_user:
                print(f"{user_data['username']} already exists")
                continue

            db.add(
                User(
                    username=user_data["username"],
                    password_hash=pwd_context.hash(user_data["password"]),
                    role=user_data["role"],
                )
            )
            print(f"{user_data['username']} created")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
