/**
 * Taste Feedback Loop — automatic extraction.
 *
 * After each assistant turn, scans the user's last message for correction
 * patterns and records TasteSignals automatically (no UI click required).
 * This is the implicit side of the feedback loop — complements the explicit
 * "✕ Not right" button in MessageBubble.
 *
 * Patterns detected (only explicit statements, never inferred):
 * - "I didn't like X because..." / "X was wrong..." → avoidance + correction
 * - "Not into [genre/director/pacing/tone]..." → preference
 * - "Too [adjective]..." → preference (tone)
 * - "That's not what I meant..." → correction
 *
 * Extraction runs async post-turn — never blocks the chat response.
 */

import type { DB } from "../db/connection.js";
import { getLlm } from "../llm/openrouter.js";
import { recordSignal, type SignalKind } from "./feedbackService.js";

const EXTRACTION_MODEL = "anthropic/claude-3-5-sonnet-20241022";

export interface ExtractedSignal {
  kind: SignalKind;
  target: string;
  reason: string;
}

/**
 * Extract taste signals from a user message using LLM pattern matching.
 * Returns only what the user *explicitly* stated — never manufactured.
 */
export async function extractSignalsFromMessage(
  db: DB,
  conversationId: number,
  userMessage: string,
): Promise<ExtractedSignal[]> {
  if (!userMessage || userMessage.trim().length < 10) return [];

  const prompt = `Scan the user's message for EXPLICIT correction or preference statements.
Only extract what the user directly stated — never infer a signal from mere
preference expression. Return JSON array, empty if nothing found.

Patterns:
- "I didn't like X because..." → kind="correction", target=X, reason="..."
- "X was wrong, I meant..." → kind="correction", target=X, reason="..."
- "Not into [genre/director/...]" → kind="preference", target=genre/director/etc
- "Too [adjective]" → kind="preference", target=adjective, reason from context
- "Don't recommend [genre/director]" → kind="avoid_genre" or "avoid_director"

For genre avoidance: target = the genre (lowercase).
For director avoidance: target = director name.
For title corrections: target = the title, reason = what was wrong.

Output only JSON array: [{"kind":"...","target":"...","reason":"..."}]`;

  try {
    const llm = getLlm();
    const response = await llm.chat.completions.create({
      model: EXTRACTION_MODEL,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 256,
      response_format: { type: "json_object" },
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "[]";
    const data = JSON.parse(text) as ExtractedSignal[];

    if (!Array.isArray(data)) return [];

    // Record each extracted signal
    for (const sig of data) {
      if (sig.kind && sig.target && sig.target.trim()) {
        recordSignal(db, sig.kind, sig.target.trim(), sig.reason ?? "");
      }
    }

    return data.filter((s) => s.kind && s.target);
  } catch (err) {
    // Never break the chat turn for feedback extraction
    console.error("[feedbackExtractor] extraction failed:", err);
    return [];
  }
}
