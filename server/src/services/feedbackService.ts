import type { DB } from "../db/connection.js";

export type SignalKind =
  | "avoid_title"
  | "avoid_genre"
  | "avoid_director"
  | "avoid_actor"
  | "preference"
  | "correction";

export interface TasteSignal {
  id: number;
  kind: SignalKind;
  target: string;
  reason: string;
  created_at: string;
}

/**
 * Taste Feedback Loop — explicit, user-authored corrections that compound
 * across sessions. Unlike the library-derived taste profile (ratings,
 * favorites), these are *stated* preferences: "don't recommend slow-burn
 * noirs", "that was wrong because I meant the 1998 remake", etc.
 *
 * Stored verbatim (kind + target + reason) so the model can read the
 * user's own words back in the contextual register. No LLM interpretation
 * at write time — keep the capture cheap and lossless.
 */
export function recordSignal(
  db: DB,
  kind: SignalKind,
  target: string,
  reason = "",
): TasteSignal {
  const res = db
    .prepare(
      "INSERT INTO taste_signals (kind, target, reason) VALUES (?, ?, ?)",
    )
    .run(kind, target.slice(0, 200).trim(), reason.slice(0, 500).trim());
  return {
    id: Number(res.lastInsertRowid),
    kind,
    target: target.slice(0, 200).trim(),
    reason: reason.slice(0, 500).trim(),
    created_at: new Date().toISOString(),
  };
}

export function getSignals(db: DB): TasteSignal[] {
  return db
    .prepare("SELECT id, kind, target, reason, created_at FROM taste_signals ORDER BY id DESC")
    .all() as TasteSignal[];
}

/** Render signals as a compact context block for the system prompt.
 *
 * Decay/clamp (brand correction #2): a user who vents twice about a genre
 * in one week must not ossify the taste profile. We cap to the 15 most
 * recent signals and drop anything older than 30 days, then surface the
 * age so the model can discount stale signals without losing them entirely.
 */
export function renderTasteSignals(db: DB): string {
  const THIRTY_DAYS = 30 * 86_400_000;
  const now = Date.now();
  const signals = getSignals(db)
    .filter((s) => {
      const age = now - new Date(s.created_at).getTime();
      return age < THIRTY_DAYS; // prune signals older than 30 days
    })
    .slice(0, 15); // cap at 15 most recent

  if (!signals.length) return "";

  const lines = signals.map((s) => {
    const head = s.kind.replace(/_/g, " ");
    const reason = s.reason ? ` — ${s.reason}` : "";
    const ageDays = Math.round((now - new Date(s.created_at).getTime()) / 86_400_000);
    const ageTag = ageDays > 1 ? ` (recently, ${ageDays}d ago)` : " (just now)";
    return `- ${head}: ${s.target}${reason}${ageTag}`;
  });
  return `## Stated taste signals (explicit user feedback — honor these over inferred preferences)\n${lines.join("\n")}`;
}
