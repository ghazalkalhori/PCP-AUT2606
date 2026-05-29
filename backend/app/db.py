from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# The app currently uses SQLite locally; check_same_thread allows FastAPI sessions
# to be opened across request/background-task contexts.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# FastAPI dependencies create one short-lived SessionLocal per request.
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()
