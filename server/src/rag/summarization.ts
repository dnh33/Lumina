/**
 * RAG · Layer 0 — Rolling conversation summary.
 *
 * When a conversation exceeds HISTORY_LIMIT messages, older turns are
 * compressed into a structured summary block prepended to the system prompt.
 * This preserves key context (taste signals, open threads, facts) beyond
 * the token window without losing relationship continuity.
 */

import type { DB } from "../db/connection.js";
import { getLlm } from "../llm/openrouter.js";

export interface ConversationSummary {
  keyFacts: string[];
  openThreads: string[];
  tasteSignals: string[];
  lastUpdated: string;
}

const SUMMARY_MODEL = "anthropic/claude-3-5-sonnet-20241022";

/**
 * Retrieve the latest summary for a conversation, if one exists.
 */
export function getConversationSummary(db: DB, conversationId: number): ConversationSummary | null {
  const row = db
    .prepare(
      "SELECT content, created_at FROM conversation_summaries WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .get(conversationId) as { content: string; created_at: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.content) as ConversationSummary;
  } catch {
    return null;
  }
}

/**
 * Check if a conversation needs compression (history > threshold).
 */
export function needsCompression(db: DB, conversationId: number, threshold: number = 30): boolean {
  const count = db
    .prepare("SELECT COUNT(*) as c FROM messages WHERE conversation_id = ?")
    .get(conversationId) as { c: number };
  return count.c > threshold;
}

/**
 * Compress conversation history into a structured summary.
 * Uses the oldest messages (those about to fall out of HISTORY_LIMIT).
 */
function emptySummary(): ConversationSummary {
  return { keyFacts: [], openThreads: [], tasteSignals: [], lastUpdated: new Date().toISOString() };
}

export async function compressHistory(db: DB, conversationId: number): Promise<ConversationSummary> {
  const rows = db
    .prepare(
      `SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id ASC`,
    )
    .all(conversationId) as { role: "user" | "assistant"; content: string }[];

  const count = rows.length;
  // Throttle: only re-compress roughly every 10 new messages past the threshold,
  // and never when there is too little to summarize. Re-summarizing every turn
  // wastes tokens and slowly erodes earlier facts as the window slides.
  if (count < 40) return getConversationSummary(db, conversationId) ?? emptySummary();
  if (count % 10 !== 0) return getConversationSummary(db, conversationId) ?? emptySummary();

  const historyText = rows
    .map((r) => `[${r.role.toUpperCase()}] ${r.content}`)
    .join("\n\n");

  const prompt = `You are a summarizer for Lumina, a personal cinema companion. Compress the conversation below into a structured JSON object. Extract:

1. **keyFacts**: concrete facts stated (titles discussed, years, genres, directors, ratings given)
2. **openThreads**: unresolved questions, recommendations not yet decided, titles to check out
3. **tasteSignals**: explicit taste preferences expressed ("prefers slow-burn," "dislikes horror," "loved the cinematography," etc.)

If an existing summary is provided, MERGE it: keep durable facts, open-threads and taste
signals that are still true, update or drop ones that are resolved, and add new ones from
the conversation. Do not discard earlier taste signals unless explicitly contradicted.
Return ONLY JSON in this exact shape (no prose, no markdown fences):
{"keyFacts": ["fact1", "fact2"], "openThreads": ["thread1"], "tasteSignals": ["signal1"]}`;

  const prevSummary = getConversationSummary(db, conversationId);
  const llm = getLlm();
  const response = await llm.chat.completions.create({
    model: SUMMARY_MODEL,
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content:
          (prevSummary
            ? `EXISTING SUMMARY (merge with it):\n${JSON.stringify(prevSummary)}\n\nNEW CONVERSATION TURNS:\n`
            : "") + historyText.slice(-8000),
      }, // token budget
    ],
    temperature: 0.3,
    max_tokens: 512,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "";
  let parsed: ConversationSummary;
  try {
    parsed = JSON.parse(text) as ConversationSummary;
  } catch {
    // Fallback if parsing fails
    parsed = {
      keyFacts: [],
      openThreads: [],
      tasteSignals: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  parsed.lastUpdated = new Date().toISOString();

  // Persist the summary
  db.prepare(
    "INSERT INTO conversation_summaries (conversation_id, content, created_at) VALUES (?, ?, ?)",
  ).run(conversationId, JSON.stringify(parsed), parsed.lastUpdated);

  return parsed;
}

/**
 * Render a ConversationSummary as a system prompt context block.
 */
export function renderSummary(summary: ConversationSummary): string {
  const parts: string[] = [];
  parts.push("## Conversation summary (from older turns now outside the active window)");
  if (summary.keyFacts.length) {
    parts.push(`Key facts: ${summary.keyFacts.join("; ")}.`);
  }
  if (summary.openThreads.length) {
    parts.push(`Open threads: ${summary.openThreads.join("; ")}.`);
  }
  if (summary.tasteSignals.length) {
    parts.push(`Taste signals: ${summary.tasteSignals.join("; ")}.`);
  }
  return parts.join("\n");
}
