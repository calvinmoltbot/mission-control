import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'mission-control.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initDb();
  }
  return db;
}

function initDb() {
  if (!db) return;
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT,
      name TEXT,
      schedule_type TEXT,
      schedule_expr TEXT,
      next_run_at DATETIME,
      last_run_at DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export interface Activity {
  id: number;
  type: string;
  title: string;
  description?: string;
  metadata?: string;
  created_at: string;
}

export interface ScheduledTask {
  id: number;
  job_id?: string;
  name?: string;
  schedule_type?: string;
  schedule_expr?: string;
  next_run_at?: string;
  last_run_at?: string;
  status: string;
  created_at: string;
}
