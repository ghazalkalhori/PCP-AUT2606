from app.db import SessionLocal, engine, Base
from app.models import User
from passlib.context import CryptContext

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create tables (if not already created)
Base.metadata.create_all(bind=engine)

# Create DB session
db = SessionLocal()

# Define user credentials (you can change these)
username = "admin"
password = "admin123"

# Hash the password
hashed_password = pwd_context.hash(password)

# Check if user already exists
existing_user = db.query(User).filter(User.username == username).first()

if existing_user:
    print("User already exists")
else:
    new_user = User(
        username=username,
        password_hash=hashed_password,
        role="admin"
    )
    db.add(new_user)
    db.commit()
    print("User created successfully")

db.close()