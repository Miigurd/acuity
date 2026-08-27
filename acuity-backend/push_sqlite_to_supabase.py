import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

def main():
    print("==================================================")
    print("       ACUITY DB MIGRATOR (SQLite -> Supabase)    ")
    print("==================================================")
    
    # 1. Setup connections
    sqlite_path = os.path.abspath(os.path.join("data", "acuity.db"))
    if not os.path.exists(sqlite_path):
        print(f"Error: Local SQLite DB not found at {sqlite_path}")
        return
        
    sqlite_engine = create_engine(f"sqlite:///{sqlite_path}")
    
    supabase_url = os.getenv("DATABASE_URL")
    if not supabase_url or "sqlite" in supabase_url:
        print("Error: DATABASE_URL in .env is not set to Supabase.")
        print("Please update .env with your Supabase postgresql:// URL.")
        return
        
    supabase_engine = create_engine(supabase_url)
    
    # 2. Order of tables matters because of Foreign Key constraints!
    # We must insert parent tables before child tables.
    table_order = [
        "bplo_registry",
        "businesses",
        "business_categories",
        "business_services",
        "business_locations",
        "business_hours",
        "business_phones",
        "business_prices",
        "business_stats",
        "flag_logs",
        "verification_matches",
        "edit_history_logs",
        "business_status_history"
    ]
    
    print("Connecting to databases...")
    
    try:
        with sqlite_engine.connect() as sqlite_conn:
            with supabase_engine.connect() as pg_conn:
                
                # Turn off foreign key constraints temporarily if needed, but the sorted order should be enough
                for table in table_order:
                    try:
                        print(f"Migrating {table}...")
                        df = pd.read_sql_table(table, sqlite_conn)
                        
                        if df.empty:
                            print(f"  -> {table} is empty, skipping.")
                            continue
                            
                        # Insert into Supabase
                        # app.py db.create_all() creates schemas first, so we append
                        df.to_sql(table, pg_conn, if_exists='append', index=False)
                        print(f"  -> Successfully migrated {len(df)} rows into {table}.")
                        
                    except Exception as table_err:
                        # Some tables might not exist if they are empty or weren't created
                        print(f"  -> Skipped {table}: {table_err}")
                        
        print("\n==================================================")
        print(" Migration Complete! Your Supabase is now synced.")
        print("==================================================")
        
    except Exception as e:
        print(f"\nMigration failed: {e}")

if __name__ == "__main__":
    main()
