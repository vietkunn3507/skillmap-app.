import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
const file = path.resolve(
  /* turbopackIgnore: true */ process.env.AUTH_DB_PATH ||
    ".data/skillmap.sqlite",
);
mkdirSync(path.dirname(file), { recursive: true });
const globalDb = globalThis as unknown as { skillmapDB?: DatabaseSync };
export const db = globalDb.skillmapDB || new DatabaseSync(file);
globalDb.skillmapDB = db;
// Set the lock timeout before any journal/schema operations. Next build workers
// can initialize this module concurrently; re-setting WAL needlessly takes locks.
db.exec("PRAGMA busy_timeout=10000; PRAGMA foreign_keys=ON;");
const journal = db.prepare("PRAGMA journal_mode").get() as { journal_mode: string };
if (journal.journal_mode.toLowerCase() !== "wal") db.exec("PRAGMA journal_mode=WAL;");
db.exec(`CREATE TABLE IF NOT EXISTS skill_profiles(user_id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS career_cvs(user_id TEXT PRIMARY KEY,filename TEXT NOT NULL,mime TEXT NOT NULL,content BLOB NOT NULL,extracted_text TEXT,created_at TEXT NOT NULL);`);
