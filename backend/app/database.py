import sqlite3
import json
from datetime import datetime
from backend.app.config import DATABASE_PATH

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS resume_analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            job_title TEXT NOT NULL,
            job_description TEXT NOT NULL,
            created_at TEXT NOT NULL,
            analysis_json TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def save_analysis(filename: str, job_title: str, job_description: str, analysis_data: dict) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()
    analysis_json = json.dumps(analysis_data)
    
    cursor.execute("""
        INSERT INTO resume_analyses (filename, job_title, job_description, created_at, analysis_json)
        VALUES (?, ?, ?, ?, ?)
    """, (filename, job_title, job_description, created_at, analysis_json))
    
    analysis_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return analysis_id

def get_analyses_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, filename, job_title, created_at, analysis_json 
        FROM resume_analyses 
        ORDER BY id DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            "id": row["id"],
            "filename": row["filename"],
            "job_title": row["job_title"],
            "created_at": row["created_at"],
            "result": json.loads(row["analysis_json"])
        })
    return history

def get_analysis(analysis_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, filename, job_title, job_description, created_at, analysis_json 
        FROM resume_analyses 
        WHERE id = ?
    """, (analysis_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "id": row["id"],
            "filename": row["filename"],
            "job_title": row["job_title"],
            "job_description": row["job_description"],
            "created_at": row["created_at"],
            "result": json.loads(row["analysis_json"])
        }
    return None

def delete_analysis_record(analysis_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM resume_analyses WHERE id = ?", (analysis_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
