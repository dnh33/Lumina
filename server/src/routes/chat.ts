import { Router } from "express";
import { getDb } from "../db/connection.js";
import {
  createConversation,
  runChatTurn,
  type ChatEvent,
} from "../llm/chatService.js";

export const chatRouter = Router();

chatRouter.get("/conversations", (_req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
              (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count,
              (SELECT substr(content, 1, 120) FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message
       FROM conversations c ORDER BY c.updated_at DESC`,
    )
    .all();
  res.json(rows);
});

chatRouter.post("/conversations", (req, res) => {
  const id = createConversation(getDb(), (req.body as { title?: string })?.title);
  res.status(201).json({ id });
});

chatRouter.get("/conversations/:id/messages", (req, res) => {
  const rows = getDb()
    .prepare(
      "SELECT id, role, content, meta, created_at FROM messages WHERE conversation_id = ? ORDER BY id",
    )
    .all(Number(req.params.id));
  res.json(rows);
});

chatRouter.patch("/conversations/:id", (req, res) => {
  const title = String((req.body as { title?: string })?.title ?? "").trim();
  if (title) {
    getDb()
      .prepare("UPDATE conversations SET title = ? WHERE id = ?")
      .run(title.slice(0, 80), Number(req.params.id));
  }
  res.json({ ok: true });
});

chatRouter.delete("/conversations/:id", (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  const msgIds = db
    .prepare("SELECT id FROM messages WHERE conversation_id = ?")
    .all(id) as { id: number }[];
  for (const m of msgIds) {
    db.prepare("DELETE FROM messages_fts WHERE rowid = ?").run(m.id);
  }
  db.prepare("DELETE FROM conversations WHERE id = ?").run(id);
  res.status(204).end();
});

/** Send a message; the reply streams back as Server-Sent Events. */
chatRouter.post("/conversations/:id/messages", async (req, res) => {
  const conversationId = Number(req.params.id);
  const content = String((req.body as { content?: string })?.content ?? "").trim();
  if (!content) return void res.status(400).json({ error: "content required" });

  const exists = getDb()
    .prepare("SELECT id FROM conversations WHERE id = ?")
    .get(conversationId);
  if (!exists) return void res.status(404).json({ error: "Conversation not found" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (e: ChatEvent) => {
    res.write(`data: ${JSON.stringify(e)}\n\n`);
  };

  try {
    await runChatTurn(getDb(), conversationId, content, send);
  } catch (err) {
    send({
      type: "error",
      message: (err as Error).message || "The AI companion is unavailable.",
    });
  } finally {
    res.end();
  }
});
