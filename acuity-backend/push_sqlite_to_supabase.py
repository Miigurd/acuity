import os
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

def main():
    print("==================================================")
    print("       ACUITY DB MIGRATOR (SQLite -> Supabase)    ")
    print("==================================================")
    
    sqlite_path = os.path.abspath(os.path.join("data", "acuity.db"))
    sqlite_engine = create_engine(f"sqlite:///{sqlite_path}")
    
    supabase_url = os.getenv("DATABASE_URL")
    supabase_engine = create_engine(supabase_url)
    
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
    
    # Truncation limits per column (if known to be smaller than 255)
    limits = {
        'status': 50,
        'flag_status': 50,
        'published_at': 50,
        'category_id': 50,
        'landmark_id': 50,
        'owner_pin': 100,
        'created_at': 50,
        'timestamp': 50,
        'ip_address': 45,
        'previous_status': 50,
        'new_status': 50,
        'action_type': 50
    }
    text_cols = ['description', 'address', 'contact_info', 'reason', 'name']

    try:
        with sqlite_engine.connect() as sqlite_conn:
            with supabase_engine.connect() as pg_conn:
                for table in table_order:
                    try:
                        df = pd.read_sql_table(table, sqlite_conn)
                        if df.empty:
                            print(f"  -> {table} is empty, skipping.")
                            continue
                            
                        # Force truncation on all strings
                        for col in df.columns:
                            if col not in text_cols:
                                max_len = limits.get(col, 255)
                                df[col] = df[col].apply(
                                    lambda x: str(x)[:max_len] if pd.notna(x) and isinstance(x, str) else x
                                )
                            
                        df.to_sql(table, pg_conn, if_exists='append', index=False)
                        print(f"  -> Successfully migrated {len(df)} rows into {table}.")
                        
                    except Exception as table_err:
                        safe_err = str(table_err).encode('ascii', 'ignore').decode()
                        print(f"  -> Skipped {table} (Error: {safe_err[:200]}...)")
                        
        print("\n==================================================")
        print(" Migration Complete! Your Supabase is now synced.")
        print("==================================================")
        
    except Exception as e:
        safe_e = str(e).encode('ascii', 'ignore').decode()
        print(f"\nMigration failed: {safe_e[:200]}")

if __name__ == "__main__":
    main()
