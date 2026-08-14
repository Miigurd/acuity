import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "acuity.db")
conn = sqlite3.connect(db_path)
c = conn.cursor()

def try_exec(sql):
    try:
        c.execute(sql)
        print(f"Success: {sql}")
    except sqlite3.OperationalError as e:
        print(f"Skipped: {sql} ({e})")

try_exec("ALTER TABLE flag_logs ADD COLUMN is_archived BOOLEAN DEFAULT 0;")
try_exec("ALTER TABLE businesses ADD COLUMN flag_status VARCHAR(50);")
try_exec("ALTER TABLE businesses ADD COLUMN last_verified_year INTEGER;")
try_exec("ALTER TABLE businesses ADD COLUMN pin_locked BOOLEAN DEFAULT 0;")
try_exec("ALTER TABLE businesses ADD COLUMN owner_pin VARCHAR(100);")
try_exec("""
CREATE TABLE business_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    admin_id VARCHAR(255),
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    timestamp VARCHAR(50),
    FOREIGN KEY(business_id) REFERENCES businesses(id)
);
""")

conn.commit()
conn.close()
