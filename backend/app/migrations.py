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

            # Monitoring & Notification Extensions
            new_pref_cols = {
                "daily_reminder_enabled": ("BOOLEAN DEFAULT TRUE", "BOOLEAN DEFAULT 1"),
                "weekly_summary_enabled": ("BOOLEAN DEFAULT TRUE", "BOOLEAN DEFAULT 1"),
                "sudden_change_alerts_enabled": ("BOOLEAN DEFAULT TRUE", "BOOLEAN DEFAULT 1"),
                "browser_push_enabled": ("BOOLEAN DEFAULT FALSE", "BOOLEAN DEFAULT 0"),
                "whatsapp_enabled": ("BOOLEAN DEFAULT FALSE", "BOOLEAN DEFAULT 0"),
                "preferred_days": ("TEXT DEFAULT '[\"Mon\", \"Tue\", \"Wed\", \"Thu\", \"Fri\", \"Sat\", \"Sun\"]'", "TEXT DEFAULT '[\"Mon\", \"Tue\", \"Wed\", \"Thu\", \"Fri\", \"Sat\", \"Sun\"]'"),
                "quiet_hours_start": ("VARCHAR(10) DEFAULT '22:00'", "VARCHAR(10) DEFAULT '22:00'"),
                "quiet_hours_end": ("VARCHAR(10) DEFAULT '07:00'", "VARCHAR(10) DEFAULT '07:00'"),
                "whatsapp_phone": ("VARCHAR(30)", "VARCHAR(30)"),
                "whatsapp_consent": ("BOOLEAN DEFAULT FALSE", "BOOLEAN DEFAULT 0"),
                "whatsapp_consent_at": ("TIMESTAMP", "DATETIME"),
                "last_daily_reminder_date": ("DATE", "DATE"),
                "last_weekly_report_date": ("DATE", "DATE"),
                "counsellor_referral_enabled": ("BOOLEAN DEFAULT TRUE", "BOOLEAN DEFAULT 1"),
                "follow_up_frequency_days": ("INTEGER DEFAULT 2", "INTEGER DEFAULT 2"),
                "is_paused": ("BOOLEAN DEFAULT FALSE", "BOOLEAN DEFAULT 0"),
                "paused_until": ("DATE", "DATE"),
                "whatsapp_reminders_consent": ("BOOLEAN DEFAULT TRUE", "BOOLEAN DEFAULT 1"),
                "whatsapp_weekly_summary_consent": ("BOOLEAN DEFAULT TRUE", "BOOLEAN DEFAULT 1"),
                "whatsapp_alerts_consent": ("BOOLEAN DEFAULT TRUE", "BOOLEAN DEFAULT 1"),
                "whatsapp_followup_consent": ("BOOLEAN DEFAULT TRUE", "BOOLEAN DEFAULT 1"),
                "whatsapp_counsellor_consent": ("BOOLEAN DEFAULT TRUE", "BOOLEAN DEFAULT 1"),
                "whatsapp_mindy_consent": ("BOOLEAN DEFAULT TRUE", "BOOLEAN DEFAULT 1"),
                "whatsapp_verified": ("BOOLEAN DEFAULT FALSE", "BOOLEAN DEFAULT 0"),
                "whatsapp_verification_code": ("VARCHAR(20)", "VARCHAR(20)"),
            }

            for col_name, (pg_type, sql_type) in new_pref_cols.items():
                if col_name not in pref_cols:
                    if is_postgres:
                        conn.execute(text(f"ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS {col_name} {pg_type};"))
                    else:
                        conn.execute(text(f"ALTER TABLE user_preferences ADD COLUMN {col_name} {sql_type};"))

            conn.commit()

        # Check wellbeing_anomaly_alerts table for proactive follow-up and response columns
        if "wellbeing_anomaly_alerts" in inspector.get_table_names():
            alert_cols = [c["name"] for c in inspector.get_columns("wellbeing_anomaly_alerts")]
            new_alert_cols = {
                "follow_up_stage": ("INTEGER DEFAULT 1", "INTEGER DEFAULT 1"),
                "follow_up_count": ("INTEGER DEFAULT 0", "INTEGER DEFAULT 0"),
                "last_follow_up_at": ("TIMESTAMP", "DATETIME"),
                "resolution_status": ("VARCHAR(50) DEFAULT 'active'", "VARCHAR(50) DEFAULT 'active'"),
                "student_response": ("VARCHAR(100)", "VARCHAR(100)"),
                "student_response_at": ("TIMESTAMP", "DATETIME"),
                "is_compound": ("BOOLEAN DEFAULT FALSE", "BOOLEAN DEFAULT 0"),
                "is_positive_celebration": ("BOOLEAN DEFAULT FALSE", "BOOLEAN DEFAULT 0"),
            }
            for col_name, (pg_type, sql_type) in new_alert_cols.items():
                if col_name not in alert_cols:
                    if is_postgres:
                        conn.execute(text(f"ALTER TABLE wellbeing_anomaly_alerts ADD COLUMN IF NOT EXISTS {col_name} {pg_type};"))
                    else:
                        conn.execute(text(f"ALTER TABLE wellbeing_anomaly_alerts ADD COLUMN {col_name} {sql_type};"))
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

        # Check whatsapp_messages table
        if "whatsapp_messages" not in inspector.get_table_names():
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS whatsapp_messages (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                        wa_message_id VARCHAR(100) UNIQUE,
                        phone_number VARCHAR(30) NOT NULL,
                        direction VARCHAR(15) NOT NULL DEFAULT 'outbound',
                        message_type VARCHAR(30) DEFAULT 'text',
                        body TEXT,
                        payload TEXT,
                        status VARCHAR(25) DEFAULT 'sent',
                        error_code VARCHAR(50),
                        error_message TEXT,
                        conversation_context VARCHAR(50),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS ix_whatsapp_messages_user_id ON whatsapp_messages(user_id);
                    CREATE INDEX IF NOT EXISTS ix_whatsapp_messages_phone ON whatsapp_messages(phone_number);
                    CREATE INDEX IF NOT EXISTS ix_whatsapp_messages_status ON whatsapp_messages(status);
                """))
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS whatsapp_messages (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                        wa_message_id VARCHAR(100) UNIQUE,
                        phone_number VARCHAR(30) NOT NULL,
                        direction VARCHAR(15) NOT NULL DEFAULT 'outbound',
                        message_type VARCHAR(30) DEFAULT 'text',
                        body TEXT,
                        payload TEXT,
                        status VARCHAR(25) DEFAULT 'sent',
                        error_code VARCHAR(50),
                        error_message TEXT,
                        conversation_context VARCHAR(50),
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS ix_whatsapp_messages_user_id ON whatsapp_messages(user_id);
                    CREATE INDEX IF NOT EXISTS ix_whatsapp_messages_phone ON whatsapp_messages(phone_number);
                    CREATE INDEX IF NOT EXISTS ix_whatsapp_messages_status ON whatsapp_messages(status);
                """))
            conn.commit()

        # Check whatsapp_conversations table
        if "whatsapp_conversations" not in inspector.get_table_names():
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS whatsapp_conversations (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        phone_number VARCHAR(30) NOT NULL,
                        last_user_message_at TIMESTAMP,
                        current_state VARCHAR(50) DEFAULT 'idle',
                        state_data TEXT,
                        ai_conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE SET NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS ix_whatsapp_conversations_user_id ON whatsapp_conversations(user_id);
                    CREATE INDEX IF NOT EXISTS ix_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
                """))
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS whatsapp_conversations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        phone_number VARCHAR(30) NOT NULL,
                        last_user_message_at DATETIME,
                        current_state VARCHAR(50) DEFAULT 'idle',
                        state_data TEXT,
                        ai_conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE SET NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS ix_whatsapp_conversations_user_id ON whatsapp_conversations(user_id);
                    CREATE INDEX IF NOT EXISTS ix_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
                """))
            conn.commit()

        # Check whatsapp_templates table
        if "whatsapp_templates" not in inspector.get_table_names():
            if is_postgres:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS whatsapp_templates (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(100) UNIQUE NOT NULL,
                        category VARCHAR(50) DEFAULT 'UTILITY',
                        language VARCHAR(10) DEFAULT 'en',
                        status VARCHAR(30) DEFAULT 'APPROVED',
                        components_json TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS ix_whatsapp_templates_name ON whatsapp_templates(name);
                """))
            else:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS whatsapp_templates (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name VARCHAR(100) UNIQUE NOT NULL,
                        category VARCHAR(50) DEFAULT 'UTILITY',
                        language VARCHAR(10) DEFAULT 'en',
                        status VARCHAR(30) DEFAULT 'APPROVED',
                        components_json TEXT NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    );
                    CREATE INDEX IF NOT EXISTS ix_whatsapp_templates_name ON whatsapp_templates(name);
                """))
            conn.commit()
