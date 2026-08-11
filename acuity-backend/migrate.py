import sqlite3
import os

db_path = r"c:\Users\Kirt Asia\.gemini\antigravity\scratch\acuity\acuity-backend\data\acuity.db"
conn = sqlite3.connect(db_path)
c = conn.cursor()

def try_exec(sql):
    try:
        c.execute(sql)
        print(f"Success: {sql}")
    except sqlite3.OperationalError as e:
        print(f"Skipped: {sql} ({e})")

try_exec("ALTER TABLE flag_logs ADD COLUMN ip_address VARCHAR(45);")
try_exec("ALTER TABLE businesses ADD COLUMN published_at VARCHAR(50);")
try_exec("ALTER TABLE edit_history_logs ADD COLUMN published_at VARCHAR(50);")
try_exec("CREATE INDEX ix_businesses_business_name ON businesses (business_name);")
try_exec("CREATE INDEX ix_businesses_status ON businesses (status);")
try_exec("CREATE INDEX ix_businesses_is_verified ON businesses (is_verified);")

conn.commit()
conn.close()
