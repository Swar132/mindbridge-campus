"""
Migrate all data from local SQLite database to cloud PostgreSQL database.
Usage:
    python backend/migrate_to_postgres.py --target "postgresql://user:pass@host/dbname"
"""
import sys
import os
import argparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database import Base
from app.models.user import User, CounsellorProfile, UserPreference
from app.models.tracking import MoodEntry, StressEntry, SleepEntry
from app.models.journal import JournalEntry
from app.models.appointment import Appointment
from app.models.resource import WellbeingResource
from app.models.notification import Notification
from app.models.ai import AIConversation, AIMessage

MODELS = [
    User,
    UserPreference,
    CounsellorProfile,
    WellbeingResource,
    MoodEntry,
    StressEntry,
    SleepEntry,
    JournalEntry,
    Appointment,
    Notification,
    AIConversation,
    AIMessage
]

def migrate(sqlite_path: str, postgres_url: str):
    if postgres_url.startswith("postgres://"):
        postgres_url = postgres_url.replace("postgres://", "postgresql://", 1)

    print(f"[*] Source SQLite: {sqlite_path}")
    print(f"[*] Target PostgreSQL: {postgres_url.split('@')[-1] if '@' in postgres_url else postgres_url}")

    src_engine = create_engine(f"sqlite:///{sqlite_path}", connect_args={"check_same_thread": False})
    dest_engine = create_engine(postgres_url)

    # Create tables in target database
    print("[*] Creating schema in target database...")
    Base.metadata.create_all(dest_engine)

    SrcSession = sessionmaker(bind=src_engine)
    DestSession = sessionmaker(bind=dest_engine)

    src_db = SrcSession()
    dest_db = DestSession()

    try:
        for model in MODELS:
            table_name = model.__tablename__
            rows = src_db.query(model).all()
            print(f"[*] Migrating table '{table_name}': {len(rows)} records found.")

            for row in rows:
                # Merge into destination session
                data = {c.name: getattr(row, c.name) for c in row.__table__.columns}
                existing = dest_db.query(model).filter(model.id == row.id).first()
                if not existing:
                    new_item = model(**data)
                    dest_db.add(new_item)

            dest_db.commit()

        print("[+] Migration completed successfully! All data transferred to PostgreSQL.")
    except Exception as e:
        dest_db.rollback()
        print(f"[-] Migration error: {e}")
        raise
    finally:
        src_db.close()
        dest_db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate SQLite to PostgreSQL")
    parser.add_argument("--source", default=os.path.join(os.path.dirname(__file__), "mindbridge.db"), help="Source SQLite DB path")
    parser.add_argument("--target", required=True, help="Target PostgreSQL connection string")
    args = parser.parse_args()

    migrate(args.source, args.target)
