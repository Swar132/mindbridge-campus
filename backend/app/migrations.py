from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

def run_migrations(engine: Engine):
    """
    Safely adds missing columns and tables to existing database
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

            if "email_verified" not in user_cols:
                if is_postgres:
                    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;"))
                else:
                    conn.execute(text("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0;"))
            
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

        # Check phone_verifications table for otp_hash and otp_salt
        if "phone_verifications" in inspector.get_table_names():
            pv_cols = [c["name"] for c in inspector.get_columns("phone_verifications")]
            if is_postgres and "otp_code" in pv_cols:
                try:
                    conn.execute(text("ALTER TABLE phone_verifications ALTER COLUMN otp_code DROP NOT NULL;"))
                except Exception as ex:
                    print(f"[MIGRATION] Notice dropping NOT NULL on otp_code: {ex}")

            if "otp_hash" not in pv_cols:
                if is_postgres:
                    conn.execute(text("ALTER TABLE phone_verifications ADD COLUMN IF NOT EXISTS otp_hash VARCHAR(128) DEFAULT '';"))
                    conn.execute(text("ALTER TABLE phone_verifications ADD COLUMN IF NOT EXISTS otp_salt VARCHAR(32) DEFAULT '';"))
                else:
                    conn.execute(text("ALTER TABLE phone_verifications ADD COLUMN otp_hash VARCHAR(128) DEFAULT '';"))
                    conn.execute(text("ALTER TABLE phone_verifications ADD COLUMN otp_salt VARCHAR(32) DEFAULT '';"))
            conn.commit()

        # Check ai_conversations table for summary column
        if "ai_conversations" in inspector.get_table_names():
            conv_cols = [c["name"] for c in inspector.get_columns("ai_conversations")]
            if "summary" not in conv_cols:
                if is_postgres:
                    conn.execute(text("ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS summary TEXT;"))
                else:
                    conn.execute(text("ALTER TABLE ai_conversations ADD COLUMN summary TEXT;"))
                conn.commit()

        # Check student_memories table
        if "student_memories" not in inspector.get_table_names():
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS student_memories (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        category VARCHAR(50) NOT NULL DEFAULT 'goal',
                        topic VARCHAR(255) NOT NULL DEFAULT 'General Goal',
                        key_point TEXT NOT NULL,
                        details TEXT,
                        progress_status VARCHAR(50) NOT NULL DEFAULT 'active',
                        target_frequency VARCHAR(100),
                        last_mentioned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_active BOOLEAN DEFAULT TRUE
                    );
                    CREATE INDEX IF NOT EXISTS ix_student_memories_user_id ON student_memories(user_id);
                """))
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS student_memories (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        category VARCHAR(50) NOT NULL DEFAULT 'goal',
                        topic VARCHAR(255) NOT NULL DEFAULT 'General Goal',
                        key_point TEXT NOT NULL,
                        details TEXT,
                        progress_status VARCHAR(50) NOT NULL DEFAULT 'active',
                        target_frequency VARCHAR(100),
                        last_mentioned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        is_active BOOLEAN DEFAULT 1
                    );
                    CREATE INDEX IF NOT EXISTS ix_student_memories_user_id ON student_memories(user_id);
                """))
            conn.commit()
