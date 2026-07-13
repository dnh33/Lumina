import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { env } from "../env.js";
import { migrate } from "./schema.js";

export type DB = Database.Database;

/**
 * Create a database at the given path (or in memory) with all pragmas
 * and migrations applied. Exported separately from the singleton so tests
 * can spin up isolated instances.
 */
export function createDb(dbPath: string): DB {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("synchronous = NORMAL");
  try {
    migrate(db);
  } catch (err) {
    throw new Error(
      `DB migration failed (user_version=${db.pragma("user_version", { simple: true })}) ` +
        `— ${(err as Error).message}. If you restored from a backup, ensure user_version matches ` +
        `the schema, or start from a fresh database.`,
    );
  }
  return db;
}

let singleton: DB | null = null;

/** The app-wide database. Lazily opened on first use. */
export function getDb(): DB {
  if (!singleton) {
    singleton = createDb(env.dbPath);
  }
  return singleton;
}

/** Test helper: replace the singleton (e.g. with an in-memory db). */
export function setDb(db: DB): void {
  singleton = db;
}
