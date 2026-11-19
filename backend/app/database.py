import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

def normalize_db_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url

db_url = normalize_db_url(settings.DATABASE_URL)

is_sqlite = "sqlite" in db_url

if is_sqlite:
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        echo=False
    )
else:
    # Production PostgreSQL with resilient connection pooling
    engine = create_engine(
        db_url,
        pool_pre_ping=True,      # Tests connection validity before issuing queries
        pool_recycle=1800,       # Recycles connections every 30 minutes to prevent timeouts
        pool_size=10,            # Maintained connection pool size
        max_overflow=20,         # Burst connection capacity
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
