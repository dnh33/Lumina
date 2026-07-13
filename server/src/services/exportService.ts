import type { DB } from "../db/connection.js";
import { addToLibrary, type LibraryStatus } from "./libraryService.js";
import { searchMulti } from "./discoverService.js";
import { ignoredTmdbIds } from "./libraryService.js";

export function exportAll(db: DB): unknown {
  const ignored = ignoredTmdbIds(db);
  const grab = (sql: string) => db.prepare(sql).all();
  const library = (grab("SELECT * FROM library") as { title_id: number }[]).filter(
    (row) => {
      // mirror in-app surfaces: ignored-but-kept titles do not reappear in export
      const t = db
        .prepare("SELECT tmdb_id, media_type FROM titles WHERE id = ?")
        .get(row.title_id) as { tmdb_id: number; media_type: string } | undefined;
      return !t || !ignored.has(`${t.media_type}:${t.tmdb_id}`);
    },
  );
  return {
    app: "lumina",
    version: 1,
    exportedAt: new Date().toISOString(),
    titles: grab("SELECT * FROM titles"),
    library,
    episodes: grab("SELECT * FROM episodes"),
    conversations: grab("SELECT * FROM conversations"),
    messages: grab("SELECT * FROM messages"),
    // Behavior log (right of access): users can SEE their own anchor data.
    anchorUsage: grab(
      "SELECT tmdb_id, media_type, surface, created_at FROM anchor_usage",
    ),
  };
}

export interface ImportRowReport {
  input: string;
  matched: string | null;
  status: "added" | "skipped" | "not_found" | "error";
  detail?: string;
}

/**
 * Import a simple CSV of watch history. Expected columns (header optional):
 *   title, year, type (movie|tv), rating (1-10), status, notes
 * Only `title` is required — everything else is best-effort.
 */
export async function importCsv(db: DB, csv: string): Promise<ImportRowReport[]> {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  // Drop a header row if present.
  if (/^title\s*[,;]/i.test(lines[0])) lines.shift();

  const reports: ImportRowReport[] = [];
  for (const line of lines.slice(0, 500)) {
    const cols = parseCsvLine(line);
    const [titleRaw, yearRaw, typeRaw, ratingRaw, statusRaw, notesRaw] = cols;
    const title = (titleRaw ?? "").trim();
    if (!title) continue;

    try {
      const results = await searchMulti(db, title);
      const year = Number(yearRaw) || null;
      const type =
        typeRaw?.trim().toLowerCase() === "tv" ||
        typeRaw?.trim().toLowerCase() === "series"
          ? "tv"
          : typeRaw?.trim().toLowerCase() === "movie" ||
              typeRaw?.trim().toLowerCase() === "film"
            ? "movie"
            : null;

      let best = results.find(
        (r) =>
          r.title.toLowerCase() === title.toLowerCase() &&
          (!year || r.year === year) &&
          (!type || r.mediaType === type),
      );
      best ??= results.find((r) => !year || Math.abs((r.year ?? 0) - year) <= 1);
      best ??= results[0];

      if (!best) {
        reports.push({ input: title, matched: null, status: "not_found" });
        continue;
      }
      if (best.inLibrary) {
        reports.push({
          input: title,
          matched: `${best.title} (${best.year ?? "?"})`,
          status: "skipped",
          detail: "already in library",
        });
        continue;
      }

      const rating = Math.min(10, Math.max(1, Number(ratingRaw))) || null;
      const status = (["watched", "watching", "watchlist", "abandoned"] as const).includes(
        (statusRaw ?? "").trim().toLowerCase() as LibraryStatus,
      )
        ? ((statusRaw ?? "").trim().toLowerCase() as LibraryStatus)
        : "watched";

      await addToLibrary(db, {
        tmdbId: best.tmdbId,
        mediaType: best.mediaType,
        status,
        rating,
        notes: (notesRaw ?? "").trim(),
      });
      reports.push({
        input: title,
        matched: `${best.title} (${best.year ?? "?"})`,
        status: "added",
      });
    } catch (err) {
      reports.push({
        input: title,
        matched: null,
        status: "error",
        detail: (err as Error).message,
      });
    }
  }
  return reports;
}

/** Minimal CSV line parser with quoted-field support. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === ";") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}
