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

/** Render signals as a compact context block for the system prompt. */
export function renderTasteSignals(db: DB): string {
  const signals = getSignals(db);
  if (!signals.length) return "";
  const lines = signals.map((s) => {
    const head = s.kind.replace(/_/g, " ");
    const reason = s.reason ? ` — ${s.reason}` : "";
    return `- ${head}: ${s.target}${reason}`;
  });
  return `## Stated taste signals (explicit user feedback — honor these over inferred preferences)\n${lines.join("\n")}`;
}
