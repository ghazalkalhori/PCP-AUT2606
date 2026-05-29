from app.db import SessionLocal, engine, Base
from app.models import User
from passlib.context import CryptContext

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create tables if they do not exist
Base.metadata.create_all(bind=engine)

# Open DB session
db = SessionLocal()

# Development seed credentials for the local admin account.
username = "admin@reporta.ai"
password = "admin123"

# Hash password
hashed_password = pwd_context.hash(password)

# Re-running the script is safe: the admin password is refreshed in place.
user = db.query(User).filter(User.username == username).first()

if user:
    # Update password if user exists
    user.password_hash = hashed_password
    user.role = "admin"
    print("User updated successfully")
else:
    # Create user if not exists
    user = User(
        username=username,
        password_hash=hashed_password,
        role="admin",
    )
    db.add(user)
    print("User created successfully")

db.commit()
db.close()
