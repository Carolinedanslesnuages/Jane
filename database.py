"""
Database module for EthoLog application.
Handles all database operations for behavior tracking.
"""

import sqlite3
import pandas as pd
from datetime import datetime
from typing import Optional, List, Tuple
import os


class BehaviorDatabase:
    """Manages SQLite database for behavior observations."""
    
    def __init__(self, db_path: str = "etholog.db"):
        """Initialize database connection and create tables if needed."""
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Create database tables if they don't exist."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create behaviors table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS behaviors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                behavior_name TEXT NOT NULL,
                category TEXT NOT NULL,
                observation_type TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                duration_seconds REAL,
                notes TEXT
            )
        """)
        
        # Create active_states table for tracking ongoing state observations
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS active_states (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                behavior_name TEXT NOT NULL,
                category TEXT NOT NULL,
                start_time DATETIME NOT NULL
            )
        """)
        
        conn.commit()
        conn.close()
    
    def record_event(self, behavior_name: str, category: str, notes: str = "") -> bool:
        """Record an event-type observation (instant action)."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO behaviors (behavior_name, category, observation_type, timestamp, notes)
                VALUES (?, ?, 'event', ?, ?)
            """, (behavior_name, category, datetime.now().isoformat(), notes))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error recording event: {e}")
            return False
    
    def start_state(self, behavior_name: str, category: str) -> bool:
        """Start tracking a state-type observation."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if this behavior is already being tracked
            cursor.execute("""
                SELECT id FROM active_states 
                WHERE behavior_name = ? AND category = ?
            """, (behavior_name, category))
            
            if cursor.fetchone():
                conn.close()
                return False  # Already tracking this behavior
            
            cursor.execute("""
                INSERT INTO active_states (behavior_name, category, start_time)
                VALUES (?, ?, ?)
            """, (behavior_name, category, datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error starting state: {e}")
            return False
    
    def stop_state(self, behavior_name: str, category: str, notes: str = "") -> bool:
        """Stop tracking a state-type observation and record the duration."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get the active state
            cursor.execute("""
                SELECT id, start_time FROM active_states 
                WHERE behavior_name = ? AND category = ?
            """, (behavior_name, category))
            
            result = cursor.fetchone()
            if not result:
                conn.close()
                return False  # No active state found
            
            active_id, start_time = result
            start_dt = datetime.fromisoformat(start_time)
            end_dt = datetime.now()
            duration = (end_dt - start_dt).total_seconds()
            
            # Record the completed observation
            cursor.execute("""
                INSERT INTO behaviors (behavior_name, category, observation_type, timestamp, duration_seconds, notes)
                VALUES (?, ?, 'state', ?, ?, ?)
            """, (behavior_name, category, end_dt.isoformat(), duration, notes))
            
            # Remove from active states
            cursor.execute("DELETE FROM active_states WHERE id = ?", (active_id,))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error stopping state: {e}")
            return False
    
    def get_active_states(self) -> List[Tuple[str, str, str]]:
        """Get all currently active state observations."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT behavior_name, category, start_time 
            FROM active_states 
            ORDER BY start_time DESC
        """)
        
        results = cursor.fetchall()
        conn.close()
        return results
    
    def get_all_observations(self) -> pd.DataFrame:
        """Get all behavior observations as a DataFrame."""
        with sqlite3.connect(self.db_path) as conn:
            df = pd.read_sql_query("""
                SELECT * FROM behaviors 
                ORDER BY timestamp DESC
            """, conn)
        
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        return df
    
    def get_observations_by_date_range(self, start_date: str, end_date: str) -> pd.DataFrame:
        """Get observations within a date range."""
        with sqlite3.connect(self.db_path) as conn:
            df = pd.read_sql_query("""
                SELECT * FROM behaviors 
                WHERE DATE(timestamp) BETWEEN ? AND ?
                ORDER BY timestamp DESC
            """, conn, params=(start_date, end_date))
        
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        return df
    
    def export_to_csv(self, filepath: str = "etholog_export.csv") -> bool:
        """Export all observations to CSV file."""
        try:
            df = self.get_all_observations()
            df.to_csv(filepath, index=False)
            return True
        except Exception as e:
            print(f"Error exporting to CSV: {e}")
            return False
    
    def delete_observation(self, observation_id: int) -> bool:
        """Delete a specific observation."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM behaviors WHERE id = ?", (observation_id,))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error deleting observation: {e}")
            return False
