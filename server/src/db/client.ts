import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DB_PATH ?? './data/treasure.db';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const migration = fs.readFileSync(path.join(dirname, 'migrations/001_init.sql'), 'utf-8');
db.exec(migration);
