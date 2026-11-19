from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

def run_migrations(engine: Engine):
    """
    Safely adds missing columns to existing tables in PostgreSQL / SQLite
    without dropping or resetting any existing user records.
    """
    inspector = inspect(engine)
    is_postgres = "postgresql" in engine.url.drivername or "postgres" in engine.url.drivername

    with engine.connect() as conn:
        # Check users table
        if "users" in inspector.get_table_names():
            user_cols = [c["name"] for c in inspector.get_columns("users")]
            
            if "phone_number" not in user_cols:
                if is_postgres:
                    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30);"))
                else:
                    conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR(30);"))
            
            if "phone_verified" not in user_cols:
                if is_postgres:
                    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;"))
                else:
                    conn.execute(text("ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT 0;"))
            
            conn.commit()

        # Check user_preferences table
        if "user_preferences" in inspector.get_table_names():
            pref_cols = [c["name"] for c in inspector.get_columns("user_preferences")]
            
            if "sms_reminders_enabled" not in pref_cols:
                if is_postgres:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS sms_reminders_enabled BOOLEAN DEFAULT FALSE;"))
                else:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN sms_reminders_enabled BOOLEAN DEFAULT 0;"))

            if "reminder_frequency" not in pref_cols:
                if is_postgres:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS reminder_frequency VARCHAR(20) DEFAULT 'daily';"))
                else:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN reminder_frequency VARCHAR(20) DEFAULT 'daily';"))

            if "timezone" not in pref_cols:
                if is_postgres:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';"))
                else:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';"))

            if "sms_consent_given" not in pref_cols:
                if is_postgres:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS sms_consent_given BOOLEAN DEFAULT FALSE;"))
                else:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN sms_consent_given BOOLEAN DEFAULT 0;"))

            if "sms_consent_at" not in pref_cols:
                if is_postgres:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMP;"))
                else:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN sms_consent_at DATETIME;"))

            if "last_reminder_sent_date" not in pref_cols:
                if is_postgres:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS last_reminder_sent_date DATE;"))
                else:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN last_reminder_sent_date DATE;"))

            conn.commit()
