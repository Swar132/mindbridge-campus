import sqlite3

conn = sqlite3.connect(r'C:\Users\swarp\.gemini\antigravity\scratch\mindbridge-campus\backend\mindbridge.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in cursor.fetchall()]
print('Tables in DB:', tables)
for t in ['mood_entries', 'stress_entries', 'sleep_entries', 'journal_entries', 'users']:
    if t in tables:
        cursor.execute(f"PRAGMA table_info({t})")
        cols = [c[1] for c in cursor.fetchall()]
        print(f"Columns in {t}:", cols)
conn.close()
