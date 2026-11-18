import sqlite3
import os

db_path = r'C:\Users\swarp\.gemini\antigravity\scratch\mindbridge-campus\backend\mindbridge.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(mood_entries)")
    cols = [c[1] for c in cursor.fetchall()]
    if 'energy_level' not in cols:
        print("Adding energy_level column to mood_entries...")
        cursor.execute("ALTER TABLE mood_entries ADD COLUMN energy_level INTEGER DEFAULT 5")
        conn.commit()
        print("Added energy_level successfully!")
    else:
        print("energy_level already exists in mood_entries.")

    # Check journal_entries for voice_note_url
    cursor.execute("PRAGMA table_info(journal_entries)")
    j_cols = [c[1] for c in cursor.fetchall()]
    if 'voice_note_url' not in j_cols:
        print("Adding voice_note_url column to journal_entries...")
        cursor.execute("ALTER TABLE journal_entries ADD COLUMN voice_note_url TEXT DEFAULT NULL")
        conn.commit()
        print("Added voice_note_url successfully!")
    else:
        print("voice_note_url already exists in journal_entries.")

    # Check ai_messages for message_type (text / voice) and audio_url
    cursor.execute("PRAGMA table_info(ai_messages)")
    ai_cols = [c[1] for c in cursor.fetchall()]
    if 'audio_url' not in ai_cols:
        print("Adding audio_url column to ai_messages...")
        cursor.execute("ALTER TABLE ai_messages ADD COLUMN audio_url TEXT DEFAULT NULL")
        conn.commit()
    if 'message_type' not in ai_cols:
        print("Adding message_type column to ai_messages...")
        cursor.execute("ALTER TABLE ai_messages ADD COLUMN message_type TEXT DEFAULT 'text'")
        conn.commit()

    conn.close()
print("Database schema migration complete.")
