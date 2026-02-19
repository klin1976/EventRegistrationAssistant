import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure db directory exists if we put it in a separate folder, or just use root
const dbPath = join(__dirname, 'registration.db');
const db = new Database(dbPath);

console.log('Connected to SQLite database at', dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    checkin_code TEXT UNIQUE NOT NULL,
    qr_data TEXT,
    checked_in INTEGER DEFAULT 0,
    checkin_time TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );
`);

export default db;
