/**
 * Normalize LLM/insight payloads into human prose for Featured / era copy.
 * Never surface raw JSON or markdown emphasis markers in the UI.
 */

/** Strip common inline markdown that leaks from insight hooks. */
export function stripInlineMarkdown(s: string): string {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

/** True when a string is (or embeds) a serialized insight/object dump. */
export function isRawPayloadDump(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  // Whole-string JSON object/array
  if (t.startsWith("{") || t.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(t);
      if (parsed !== null && typeof parsed === "object") return true;
    } catch {
      /* not valid JSON — fall through */
    }
  }
  // Partial dump fingerprints from failed insight caches
  if (
    /"verdict"\s*:/.test(t) &&
    /"matchScore"\s*:/.test(t) &&
    /"comparisons"\s*:/.test(t)
  ) {
    return true;
  }
  return false;
}

/**
 * Coerce an insight hook/text field into a safe thesis string.
 * Rejects objects and JSON dumps. Returns null when nothing usable remains.
 */
export function normalizeInsightThesis(
  raw: unknown,
  fallback?: string | null,
): string | null {
  let candidate: string | null = null;

  if (typeof raw === "string") {
    candidate = raw;
  } else if (raw && typeof raw === "object") {
    // Never JSON.stringify the whole insight — pull prose fields only.
    const obj = raw as Record<string, unknown>;
    if (typeof obj.hook === "string") candidate = obj.hook;
    else if (typeof obj.text === "string") candidate = obj.text;
  }

  if (candidate) {
    const cleaned = stripInlineMarkdown(candidate);
    if (cleaned && !isRawPayloadDump(cleaned)) return cleaned;
  }

  if (fallback) {
    const fb = stripInlineMarkdown(fallback);
    if (fb && !isRawPayloadDump(fb)) return fb;
  }

  return null;
}

/** Deterministic prose when insight is missing or unusable. */
export function fallbackThesisFromItem(item: {
  title: string;
  overview?: string | null;
  year?: number | null;
}): string {
  const overview = item.overview?.trim();
  if (overview) {
    const sentence = overview.split(/(?<=[.!?])\s+/)[0] ?? overview;
    return sentence.length > 180 ? `${sentence.slice(0, 177)}…` : sentence;
  }
  return item.year != null
    ? `${item.title} (${item.year}) — a standout on this shelf.`
    : `${item.title} — a standout on this shelf.`;
}
