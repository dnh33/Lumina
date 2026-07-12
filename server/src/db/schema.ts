import type { DB } from "./connection.js";

/**
 * Versioned migrations, applied via PRAGMA user_version.
 * Never edit an existing migration — append a new one.
 */
const migrations: string[] = [
  // ── v1: core schema ──────────────────────────────────────────────
  `
  CREATE TABLE titles (
    id            INTEGER PRIMARY KEY,
    tmdb_id       INTEGER NOT NULL,
    media_type    TEXT    NOT NULL CHECK (media_type IN ('movie','tv')),
    title         TEXT    NOT NULL,
    original_title TEXT,
    year          INTEGER,
    overview      TEXT    NOT NULL DEFAULT '',
    tagline       TEXT    NOT NULL DEFAULT '',
    poster_path   TEXT,
    backdrop_path TEXT,
    genres        TEXT    NOT NULL DEFAULT '[]',
    runtime       INTEGER,
    seasons_count INTEGER,
    episodes_count INTEGER,
    director      TEXT,
    top_cast      TEXT    NOT NULL DEFAULT '[]',
    vote_average  REAL,
    release_date  TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (tmdb_id, media_type)
  );

  CREATE TABLE library (
    id         INTEGER PRIMARY KEY,
    title_id   INTEGER NOT NULL UNIQUE REFERENCES titles(id) ON DELETE CASCADE,
    status     TEXT    NOT NULL DEFAULT 'watched'
               CHECK (status IN ('watched','watching','watchlist','abandoned')),
    rating     INTEGER CHECK (rating BETWEEN 1 AND 10),
    notes      TEXT    NOT NULL DEFAULT '',
    favorite   INTEGER NOT NULL DEFAULT 0,
    watched_at TEXT,
    added_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_library_status ON library(status);

  CREATE TABLE episodes (
    id         INTEGER PRIMARY KEY,
    title_id   INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
    season     INTEGER NOT NULL,
    episode    INTEGER NOT NULL,
    name       TEXT    NOT NULL DEFAULT '',
    air_date   TEXT,
    runtime    INTEGER,
    overview   TEXT    NOT NULL DEFAULT '',
    watched    INTEGER NOT NULL DEFAULT 0,
    watched_at TEXT,
    UNIQUE (title_id, season, episode)
  );
  CREATE INDEX idx_episodes_title ON episodes(title_id);

  CREATE TABLE conversations (
    id         INTEGER PRIMARY KEY,
    title      TEXT NOT NULL DEFAULT 'New conversation',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE messages (
    id              INTEGER PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT    NOT NULL CHECK (role IN ('user','assistant')),
    content         TEXT    NOT NULL,
    meta            TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_messages_conversation ON messages(conversation_id);

  CREATE TABLE tmdb_cache (
    cache_key  TEXT PRIMARY KEY,
    payload    TEXT NOT NULL,
    fetched_at INTEGER NOT NULL
  );

  CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE VIRTUAL TABLE library_fts USING fts5(
    title, overview, genres, director, top_cast, notes
  );

  CREATE VIRTUAL TABLE messages_fts USING fts5(content);
  `,

  // ── v2: personal tags + tags-aware FTS ───────────────────────────
  `
  ALTER TABLE library ADD COLUMN tags TEXT NOT NULL DEFAULT '[]';

  DROP TABLE library_fts;
  CREATE VIRTUAL TABLE library_fts USING fts5(
    title, overview, genres, director, top_cast, notes, tags
  );
  INSERT INTO library_fts (rowid, title, overview, genres, director, top_cast, notes, tags)
  SELECT l.id, t.title, t.overview, t.genres, COALESCE(t.director, ''), t.top_cast, l.notes, ''
  FROM library l JOIN titles t ON t.id = l.title_id;
  `,
];

export function migrate(db: DB): void {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let v = current; v < migrations.length; v++) {
    const apply = db.transaction(() => {
      db.exec(migrations[v]);
      db.pragma(`user_version = ${v + 1}`);
    });
    apply();
  }
}
