import type { DB } from "../db/connection.js";
import { createConversation, persistMessage } from "../llm/chatService.js";

export interface ForkRecord {
  id: number;
  parent_conversation_id: number;
  child_conversation_id: number;
  fork_point_message_index: number;
  label: string;
  anchor_titles: string;
  created_at: string;
}

/**
 * Create a fork: a new conversation that copies all messages up to (and
 * including) `forkPointMessageIndex`, plus the rolling summary (if any)
 * from the parent. The new conversation is brand-faithful — composed,
 * knowing, hush — not a product surface: it looks like any other
 * conversation, just with a "(forked from X)" label in the list.
 */
export function createFork(
  db: DB,
  parentConversationId: number,
  forkPointMessageIndex: number,
  label?: string,
): ForkRecord {
  return db.transaction(() => {
    // Copy parent messages up to the fork point (inclusive)
    const parentMessages = db
      .prepare(
        `SELECT role, content, meta FROM messages
         WHERE conversation_id = ? ORDER BY id ASC LIMIT ?`,
      )
      .all(parentConversationId, forkPointMessageIndex + 1) as {
      role: string;
      content: string;
      meta: string | null;
    }[];

    if (!parentMessages.length) {
      throw new Error("fork point must have at least one message");
    }

    // Derive a label from the anchor titles (first N messages)
    const anchorTitles: string[] = [];
    for (const m of parentMessages) {
      if (m.role === "assistant" && m.content) {
        const firstLine = m.content.split("\n")[0].slice(0, 60);
        anchorTitles.push(firstLine);
      }
    }
    const anchorTitlesJson = JSON.stringify(anchorTitles.slice(0, 5));

    // Use the parent's title for the fork label
    const parentRow = db
      .prepare("SELECT title FROM conversations WHERE id = ?")
      .get(parentConversationId) as { title: string } | undefined;
    const forkLabel2 = label ?? `Forked from ${parentRow?.title ?? "conversation"}`;

    // Create the child conversation with a descriptive title
    const childId = createConversation(db, `Fork: ${forkLabel2}`);

    // Copy messages into the child
    const insertMsg = db.prepare(
      "INSERT INTO messages (conversation_id, role, content, meta) VALUES (?, ?, ?, ?)",
    );
    for (const m of parentMessages) {
      insertMsg.run(childId, m.role, m.content, m.meta);
    }

    // Copy the parent's rolling summary into the child's conversation_summaries
    // so the fork inherits the compressed context (not the full library).
    const summary = db
      .prepare(
        "SELECT content FROM conversation_summaries WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1",
      )
      .get(parentConversationId) as { content: string } | undefined;
    if (summary) {
      db.prepare(
        "INSERT INTO conversation_summaries (conversation_id, content) VALUES (?, ?)",
      ).run(childId, summary.content);
    }

    // Link the fork
    const info = db
      .prepare(
        `INSERT INTO forks (parent_conversation_id, child_conversation_id,
                            fork_point_message_index, label, anchor_titles)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        parentConversationId,
        childId,
        forkPointMessageIndex,
        forkLabel2,
        anchorTitlesJson,
      );

    return db
      .prepare("SELECT * FROM forks WHERE id = ?")
      .get(Number(info.lastInsertRowid)) as ForkRecord;
  })();
}

/** Retrieve child forks for a parent conversation (for constellation/list display). */
export function getForks(db: DB, parentConversationId: number): ForkRecord[] {
  return db
    .prepare(
      "SELECT * FROM forks WHERE parent_conversation_id = ? ORDER BY created_at DESC",
    )
    .all(parentConversationId) as ForkRecord[];
}

/** Retrieve the parent of a conversation (for list label). */
export function getParentFork(db: DB, conversationId: number): ForkRecord | undefined {
  return db
    .prepare(
      `SELECT f.*, c.title AS parent_title
       FROM forks f JOIN conversations c ON c.id = f.parent_conversation_id
       WHERE f.child_conversation_id = ?`,
    )
    .get(conversationId) as (ForkRecord & { parent_title: string }) | undefined;
}
