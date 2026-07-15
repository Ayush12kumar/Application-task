from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

import os
import sqlalchemy

# Handle SQLite vs PostgreSQL connection string nuances
database_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
if database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

try:
    engine = create_engine(
        database_url,
        connect_args=connect_args,
        pool_pre_ping=True,
        echo=False
    )
    # Quick connectivity test
    with engine.connect() as conn:
        pass
    print(f"[Database] Successfully connected to {database_url.split('@')[-1] if '@' in database_url else database_url}")
except Exception as e:
    print(f"[Database] Notice: Could not connect to PostgreSQL ({e}). Falling back to local SQLite database (crm_hcp_demo.db) for standalone testing.")
    database_url = "sqlite:///./crm_hcp_demo.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        database_url,
        connect_args=connect_args,
        pool_pre_ping=True,
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
