"""
Database module for EthoLog application.
Handles all database operations for behavior tracking.
"""

import sqlite3
import pandas as pd
from datetime import datetime
from typing import Optional, List, Tuple
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.units import inch


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
        
        # Create individuals/dogs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS individuals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                breed TEXT,
                birth_date DATE,
                sex TEXT,
                neutered BOOLEAN,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create behaviors table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS behaviors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                behavior_name TEXT NOT NULL,
                category TEXT NOT NULL,
                observation_type TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                duration_seconds REAL,
                notes TEXT,
                individual_id INTEGER,
                location TEXT,
                weather TEXT,
                stimuli TEXT,
                FOREIGN KEY (individual_id) REFERENCES individuals(id)
            )
        """)
        
        # Create active_states table for tracking ongoing state observations
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS active_states (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                behavior_name TEXT NOT NULL,
                category TEXT NOT NULL,
                start_time DATETIME NOT NULL,
                individual_id INTEGER,
                FOREIGN KEY (individual_id) REFERENCES individuals(id)
            )
        """)
        
        # Create cognitive_tests table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cognitive_tests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                individual_id INTEGER NOT NULL,
                test_type TEXT NOT NULL,
                timestamp DATETIME NOT NULL,
                duration_seconds REAL,
                score REAL,
                notes TEXT,
                FOREIGN KEY (individual_id) REFERENCES individuals(id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    # Individual management methods
    def add_individual(self, name: str, breed: str = "", birth_date: str = None, 
                      sex: str = "", neutered: bool = False) -> bool:
        """Add a new individual/dog to the database."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO individuals (name, breed, birth_date, sex, neutered)
                VALUES (?, ?, ?, ?, ?)
            """, (name, breed, birth_date, sex, neutered))
            
            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            print(f"Individual with name '{name}' already exists")
            return False
        except Exception as e:
            print(f"Error adding individual: {e}")
            return False
    
    def get_all_individuals(self) -> pd.DataFrame:
        """Get all individuals as a DataFrame."""
        with sqlite3.connect(self.db_path) as conn:
            df = pd.read_sql_query("SELECT * FROM individuals ORDER BY name", conn)
        return df
    
    def get_individual_by_id(self, individual_id: int) -> Optional[dict]:
        """Get individual details by ID."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM individuals WHERE id = ?", (individual_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return {
                    'id': row[0], 'name': row[1], 'breed': row[2],
                    'birth_date': row[3], 'sex': row[4], 'neutered': row[5]
                }
            return None
        except Exception as e:
            print(f"Error getting individual: {e}")
            return None
    
    def delete_individual(self, individual_id: int) -> bool:
        """Delete an individual."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM individuals WHERE id = ?", (individual_id,))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error deleting individual: {e}")
            return False
    
    def record_event(self, behavior_name: str, category: str, notes: str = "", 
                    individual_id: int = None, location: str = "", 
                    weather: str = "", stimuli: str = "") -> bool:
        """Record an event-type observation (instant action)."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO behaviors (behavior_name, category, observation_type, timestamp, notes, 
                                     individual_id, location, weather, stimuli)
                VALUES (?, ?, 'event', ?, ?, ?, ?, ?, ?)
            """, (behavior_name, category, datetime.now().isoformat(), notes, 
                  individual_id, location, weather, stimuli))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error recording event: {e}")
            return False
    
    def start_state(self, behavior_name: str, category: str, individual_id: int = None) -> bool:
        """Start tracking a state-type observation."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if this behavior is already being tracked
            cursor.execute("""
                SELECT id FROM active_states 
                WHERE behavior_name = ? AND category = ? AND individual_id IS ?
            """, (behavior_name, category, individual_id))
            
            if cursor.fetchone():
                conn.close()
                return False  # Already tracking this behavior
            
            cursor.execute("""
                INSERT INTO active_states (behavior_name, category, start_time, individual_id)
                VALUES (?, ?, ?, ?)
            """, (behavior_name, category, datetime.now().isoformat(), individual_id))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error starting state: {e}")
            return False
    
    def stop_state(self, behavior_name: str, category: str, notes: str = "", 
                   individual_id: int = None, location: str = "", 
                   weather: str = "", stimuli: str = "") -> bool:
        """Stop tracking a state-type observation and record the duration."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get the active state
            cursor.execute("""
                SELECT id, start_time FROM active_states 
                WHERE behavior_name = ? AND category = ? AND individual_id IS ?
            """, (behavior_name, category, individual_id))
            
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
                INSERT INTO behaviors (behavior_name, category, observation_type, timestamp, 
                                     duration_seconds, notes, individual_id, location, weather, stimuli)
                VALUES (?, ?, 'state', ?, ?, ?, ?, ?, ?, ?)
            """, (behavior_name, category, end_dt.isoformat(), duration, notes, 
                  individual_id, location, weather, stimuli))
            
            # Remove from active states
            cursor.execute("DELETE FROM active_states WHERE id = ?", (active_id,))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error stopping state: {e}")
            return False
    
    def get_active_states(self, individual_id: int = None) -> List[Tuple[str, str, str]]:
        """Get all currently active state observations."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if individual_id is not None:
            cursor.execute("""
                SELECT behavior_name, category, start_time 
                FROM active_states 
                WHERE individual_id = ?
                ORDER BY start_time DESC
            """, (individual_id,))
        else:
            cursor.execute("""
                SELECT behavior_name, category, start_time 
                FROM active_states 
                ORDER BY start_time DESC
            """)
        
        results = cursor.fetchall()
        conn.close()
        return results
    
    def get_all_observations(self, individual_id: int = None) -> pd.DataFrame:
        """Get all behavior observations as a DataFrame."""
        with sqlite3.connect(self.db_path) as conn:
            if individual_id is not None:
                df = pd.read_sql_query("""
                    SELECT * FROM behaviors 
                    WHERE individual_id = ?
                    ORDER BY timestamp DESC
                """, conn, params=(individual_id,))
            else:
                df = pd.read_sql_query("""
                    SELECT * FROM behaviors 
                    ORDER BY timestamp DESC
                """, conn)
        
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        return df
    
    def get_observations_by_date_range(self, start_date: str, end_date: str, 
                                      individual_id: int = None) -> pd.DataFrame:
        """Get observations within a date range."""
        with sqlite3.connect(self.db_path) as conn:
            if individual_id is not None:
                df = pd.read_sql_query("""
                    SELECT * FROM behaviors 
                    WHERE DATE(timestamp) BETWEEN ? AND ? AND individual_id = ?
                    ORDER BY timestamp DESC
                """, conn, params=(start_date, end_date, individual_id))
            else:
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
    
    # Cognitive test methods
    def record_cognitive_test(self, individual_id: int, test_type: str, 
                             duration_seconds: float, score: float = None, 
                             notes: str = "") -> bool:
        """Record a cognitive test result."""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO cognitive_tests (individual_id, test_type, timestamp, 
                                           duration_seconds, score, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (individual_id, test_type, datetime.now().isoformat(), 
                  duration_seconds, score, notes))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error recording cognitive test: {e}")
            return False
    
    def get_cognitive_tests(self, individual_id: int = None) -> pd.DataFrame:
        """Get cognitive test results."""
        with sqlite3.connect(self.db_path) as conn:
            if individual_id is not None:
                df = pd.read_sql_query("""
                    SELECT * FROM cognitive_tests 
                    WHERE individual_id = ?
                    ORDER BY timestamp DESC
                """, conn, params=(individual_id,))
            else:
                df = pd.read_sql_query("""
                    SELECT * FROM cognitive_tests 
                    ORDER BY timestamp DESC
                """, conn)
        
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        return df
    
    def export_behavioral_report_pdf(self, filepath: str, individual_id: int = None, 
                                     start_date: str = None, end_date: str = None) -> bool:
        """Export a professional behavioral assessment report as PDF."""
        try:
            # Get individual info if specified
            individual_name = "Tous les individus"
            if individual_id:
                individual = self.get_individual_by_id(individual_id)
                if individual:
                    individual_name = individual['name']
            
            # Create PDF document
            doc = SimpleDocTemplate(filepath, pagesize=A4)
            elements = []
            styles = getSampleStyleSheet()
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#2C3E50'),
                spaceAfter=30,
                alignment=1  # Center
            )
            
            elements.append(Paragraph("🐕 Bilan Comportemental EthoLog", title_style))
            elements.append(Spacer(1, 0.3*inch))
            
            # Individual and period info
            info_style = styles['Normal']
            elements.append(Paragraph(f"<b>Individu:</b> {individual_name}", info_style))
            elements.append(Paragraph(f"<b>Date du rapport:</b> {datetime.now().strftime('%d/%m/%Y %H:%M')}", info_style))
            
            if start_date and end_date:
                elements.append(Paragraph(f"<b>Période analysée:</b> {start_date} au {end_date}", info_style))
            
            elements.append(Spacer(1, 0.3*inch))
            
            # Get observations data
            if start_date and end_date:
                df = self.get_observations_by_date_range(start_date, end_date, individual_id)
            else:
                df = self.get_all_observations(individual_id)
            
            if df.empty:
                elements.append(Paragraph("Aucune donnée disponible pour cette période.", styles['Normal']))
            else:
                # Summary statistics
                elements.append(Paragraph("📊 Résumé Statistique", styles['Heading2']))
                elements.append(Spacer(1, 0.1*inch))
                
                summary_data = [
                    ['Métrique', 'Valeur'],
                    ['Nombre total d\'observations', str(len(df))],
                    ['Première observation', df['timestamp'].min().strftime('%d/%m/%Y %H:%M')],
                    ['Dernière observation', df['timestamp'].max().strftime('%d/%m/%Y %H:%M')],
                ]
                
                summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
                summary_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498DB')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                elements.append(summary_table)
                elements.append(Spacer(1, 0.3*inch))
                
                # Behavior category distribution
                elements.append(Paragraph("📈 Répartition par Catégorie", styles['Heading2']))
                elements.append(Spacer(1, 0.1*inch))
                
                category_counts = df.groupby('category').size().reset_index(name='count')
                category_data = [['Catégorie', 'Nombre d\'observations']]
                for _, row in category_counts.iterrows():
                    category_data.append([row['category'], str(row['count'])])
                
                category_table = Table(category_data, colWidths=[3*inch, 2*inch])
                category_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E74C3C')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                elements.append(category_table)
                elements.append(Spacer(1, 0.3*inch))
                
                # Stress analysis
                stress_df = df[df['category'] == 'Stress']
                if not stress_df.empty:
                    elements.append(Paragraph("⚠️ Analyse des Comportements de Stress", styles['Heading2']))
                    elements.append(Spacer(1, 0.1*inch))
                    
                    stress_summary = [
                        ['Métrique', 'Valeur'],
                        ['Total de comportements de stress', str(len(stress_df))],
                        ['Comportement le plus fréquent', stress_df['behavior_name'].value_counts().index[0] if not stress_df.empty else 'N/A'],
                    ]
                    
                    # Add context analysis if available
                    if 'location' in stress_df.columns and stress_df['location'].notna().any():
                        top_location = stress_df[stress_df['location'] != ''].groupby('location').size().idxmax()
                        stress_summary.append(['Lieu le plus stressant', top_location])
                    
                    if 'stimuli' in stress_df.columns and stress_df['stimuli'].notna().any():
                        top_stimuli = stress_df[stress_df['stimuli'] != ''].groupby('stimuli').size().idxmax()
                        stress_summary.append(['Stimuli le plus stressant', top_stimuli])
                    
                    stress_table = Table(stress_summary, colWidths=[3*inch, 2*inch])
                    stress_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E67E22')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 12),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black)
                    ]))
                    
                    elements.append(stress_table)
                    elements.append(Spacer(1, 0.3*inch))
                
                # Cognitive tests if available
                if individual_id:
                    tests_df = self.get_cognitive_tests(individual_id)
                    if not tests_df.empty:
                        elements.append(PageBreak())
                        elements.append(Paragraph("🧪 Résultats des Tests Cognitifs", styles['Heading2']))
                        elements.append(Spacer(1, 0.1*inch))
                        
                        test_data = [['Test', 'Durée Moyenne (s)', 'Score Moyen', 'Nb de Tests']]
                        test_summary = tests_df.groupby('test_type').agg({
                            'duration_seconds': 'mean',
                            'score': 'mean',
                            'test_type': 'count'
                        }).reset_index()
                        
                        for _, row in test_summary.iterrows():
                            test_data.append([
                                row['test_type'],
                                f"{row['duration_seconds']:.1f}",
                                f"{row['score']:.1f}" if pd.notna(row['score']) else 'N/A',
                                str(len(tests_df[tests_df['test_type'] == row['test_type']]))
                            ])
                        
                        test_table = Table(test_data, colWidths=[2.5*inch, 1.5*inch, 1.5*inch, 1*inch])
                        test_table.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#9B59B6')),
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                            ('FONTSIZE', (0, 0), (-1, 0), 10),
                            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                            ('GRID', (0, 0), (-1, -1), 1, colors.black)
                        ]))
                        
                        elements.append(test_table)
                
                # Footer
                elements.append(Spacer(1, 0.5*inch))
                elements.append(Paragraph("_______________", styles['Normal']))
                elements.append(Paragraph(
                    "Rapport généré par EthoLog - Outil d'observation du comportement canin",
                    ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey)
                ))
            
            # Build PDF
            doc.build(elements)
            return True
            
        except Exception as e:
            print(f"Error generating PDF report: {e}")
            return False
