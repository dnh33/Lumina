import type { DB } from "../db/connection.js";
import { toFtsQuery } from "./retrieval.js";

/**
 * RAG · Layer 3 — Conversation memory.
 * Surfaces relevant moments from *past* conversations so the companion
 * remembers earlier discussions, promises and preferences.
 */

export interface MemorySnippet {
  conversationId: number;
  conversationTitle: string;
  role: string;
  excerpt: string;
  when: string;
}

export function indexMessage(db: DB, messageId: number, content: string): void {
  db.prepare("INSERT INTO messages_fts (rowid, content) VALUES (?, ?)").run(
    messageId,
    content,
  );
}

export function retrieveMemory(
  db: DB,
  query: string,
  excludeConversationId: number,
  k = 5,
): MemorySnippet[] {
  const match = toFtsQuery(query);
  if (!match) return [];

  let rows: { rowid: number }[];
  try {
    rows = db
      .prepare(
        `SELECT rowid FROM messages_fts WHERE messages_fts MATCH ?
         ORDER BY bm25(messages_fts) LIMIT ?`,
      )
      .all(match, k * 4) as { rowid: number }[];
  } catch {
    return [];
  }

  const snippets: MemorySnippet[] = [];
  for (const r of rows) {
    const m = db
      .prepare(
        `SELECT m.id, m.role, m.content, m.created_at, m.conversation_id, c.title
         FROM messages m JOIN conversations c ON c.id = m.conversation_id
         WHERE m.id = ?`,
      )
      .get(r.rowid) as
      | {
          id: number;
          role: string;
          content: string;
          created_at: string;
          conversation_id: number;
          title: string;
        }
      | undefined;
    if (!m || m.conversation_id === excludeConversationId) continue;
    snippets.push({
      conversationId: m.conversation_id,
      conversationTitle: m.title,
      role: m.role,
      excerpt: m.content.slice(0, 240),
      when: m.created_at.slice(0, 10),
    });
    if (snippets.length >= k) break;
  }
  return snippets;
}

export function renderMemory(snippets: MemorySnippet[]): string {
  if (!snippets.length) return "";
  return snippets
    .map(
      (s) =>
        `• [${s.when}, "${s.conversationTitle}"] ${s.role === "user" ? "They said" : "You said"}: "${s.excerpt}"`,
    )
    .join("\n");
}
