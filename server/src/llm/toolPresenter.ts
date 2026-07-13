/**
 * toolPresenter — pure helpers that turn raw tool-call args/results into the
 * short human strings streamed to the client trace (never raw JSON).
 *
 *   toolDetail(name, argsJson)    → WHAT the call is doing   ("“korean thrillers”")
 *   toolOutcome(name, resultJson) → what it FOUND            ("8 results", "Counterpart (2018)")
 *
 * Both are best-effort: any parse failure returns undefined and the client
 * falls back to its static verb label. Kept pure (no db, no io) so they are
 * unit-testable in isolation.
 */

type Json = Record<string, unknown>;

const MAX_DETAIL = 44;

function parse(json: string): Json | unknown[] | null {
  try {
    return JSON.parse(json) as Json | unknown[];
  } catch {
    return null;
  }
}

function clip(s: string, max = MAX_DETAIL): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

function quoted(v: unknown, max = MAX_DETAIL): string | undefined {
  return typeof v === "string" && v.trim() ? `“${clip(v, max)}”` : undefined;
}

function countNoun(n: number, singular: string, plural = `${singular}s`): string {
  if (n === 0) return `no ${plural}`;
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Salient argument of a tool call, as one short human fragment. */
export function toolDetail(name: string, argsJson: string): string | undefined {
  const a = parse(argsJson);
  if (!a || Array.isArray(a)) return undefined;

  switch (name) {
    case "search_library":
    case "search_tmdb":
      return quoted(a.query);

    case "discover_titles": {
      const bits: string[] = [];
      if (Array.isArray(a.genres) && a.genres.length) {
        bits.push(a.genres.slice(0, 3).map(String).join(" + "));
      }
      if (a.year_from != null || a.year_to != null) {
        bits.push(`${a.year_from ?? "…"}–${a.year_to ?? "now"}`);
      }
      if (typeof a.sort === "string" && a.sort) bits.push(String(a.sort));
      return bits.length ? clip(bits.join(" · "), 56) : undefined;
    }

    case "set_episode_progress": {
      const base = quoted(a.title_query, 28);
      const s = a.season != null ? Number(a.season) : undefined;
      const e = a.episode != null ? Number(a.episode) : undefined;
      const scope =
        s != null && e != null ? `S${s}E${e}` : s != null ? `season ${s}` : undefined;
      if (base && scope) return `${base} · ${scope}`;
      return base ?? scope;
    }

    case "update_library_entry":
    case "get_episode_progress":
    case "get_episode_recap":
      return quoted(a.title_query);

    case "compare_titles": {
      const n = Array.isArray(a.candidates) ? a.candidates.length : 0;
      const mood = typeof a.mood === "string" && a.mood.trim() ? ` · ${clip(a.mood, 24)}` : "";
      return n >= 2 ? `${n} picks${mood}` : undefined;
    }

    // get_taste_profile / check_continuing_series take no salient args;
    // add_to_library is narrated by its write receipt instead.
    default:
      return undefined;
  }
}

/** Result digest of a tool call, as one short human fragment. */
export function toolOutcome(name: string, resultJson: string): string | undefined {
  const r = parse(resultJson);

  // renderTasteProfile returns prose, not JSON — success looks like a parse miss.
  if (r == null) return name === "get_taste_profile" ? "profile ready" : undefined;
  if (!Array.isArray(r) && (r as Json).error) return "hit a snag";

  switch (name) {
    case "search_library":
      return Array.isArray(r) ? countNoun(r.length, "match", "matches") : undefined;

    case "search_tmdb":
      return Array.isArray(r) ? countNoun(r.length, "result") : undefined;

    case "discover_titles":
      return Array.isArray(r) ? countNoun(r.length, "candidate") : undefined;

    case "get_title_details": {
      const j = r as Json;
      if (typeof j.title !== "string" || !j.title) return undefined;
      return clip(j.year ? `${j.title} (${j.year})` : j.title, 36);
    }

    case "get_taste_profile":
      return "profile ready";

    case "get_episode_progress": {
      const j = r as Json;
      if (typeof j.watched !== "number" || typeof j.total !== "number") return undefined;
      const title = typeof j.title === "string" ? `${clip(j.title, 24)} · ` : "";
      return `${title}${j.watched}/${j.total}`;
    }

    case "check_continuing_series": {
      const j = r as Json;
      const n = Array.isArray(j.watching) ? j.watching.length : 0;
      return n ? `${countNoun(n, "show")} in progress` : "nothing in progress";
    }

    case "compare_titles": {
      const j = r as Json;
      const n = Array.isArray(j.candidates) ? j.candidates.length : 0;
      return n ? `${n} compared` : undefined;
    }

    case "get_episode_recap": {
      const j = r as Json;
      return typeof j.progress === "string" ? `caught up to ${j.progress}` : undefined;
    }

    // Write tools already produce a receipt (writeReceipt) — no second digest.
    default:
      return undefined;
  }
}
