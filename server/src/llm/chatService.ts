import type OpenAI from "openai";
import type { DB } from "../db/connection.js";
import { buildChatContext, renderContextBlock } from "../rag/contextBuilder.js";
import { indexMessage } from "../rag/memory.js";
import { currentModel, getLlm } from "./openrouter.js";
import { luminaSystemPrompt } from "./prompts.js";
import { executeTool, toolDefinitions } from "./tools.js";

const MAX_TOOL_ROUNDS = 6;
const HISTORY_LIMIT = 30;

export type ChatEvent =
  | { type: "context"; librarySize: number; matches: string[]; memoryHits: number }
  | { type: "delta"; text: string }
  | { type: "tool"; name: string }
  | { type: "tool_done"; name: string; summary?: string }
  | { type: "done"; messageId: number; conversationTitle: string }
  | { type: "error"; message: string };

/** Tools that mutate the library — their results become visible receipts. */
const WRITE_TOOLS = new Set([
  "add_to_library",
  "update_library_entry",
  "set_episode_progress",
]);

/** Turn a write-tool result into a short human receipt, or undefined. */
function writeReceipt(name: string, resultJson: string): string | undefined {
  try {
    const r = JSON.parse(resultJson) as Record<string, unknown>;
    if (r.error) return undefined;
    if (name === "add_to_library" && r.saved) {
      const bits = [`Saved ${r.title}`];
      if (r.rating) bits.push(`${r.rating}/10`);
      bits.push(String(r.status));
      return bits.join(" · ");
    }
    if (name === "update_library_entry" && r.updated) {
      const bits = [`Updated ${r.title}`];
      if (r.rating) bits.push(`${r.rating}/10`);
      const tags = r.tags as string[] | undefined;
      if (tags?.length) bits.push(tags.map((t) => `#${t}`).slice(0, 3).join(" "));
      return bits.join(" · ");
    }
    if (name === "set_episode_progress" && r.markedWatched != null) {
      return `Marked ${r.title} ${r.scope} · now ${r.progress}`;
    }
  } catch {
    /* no receipt */
  }
  return undefined;
}

type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam;

interface PendingToolCall {
  id: string;
  name: string;
  arguments: string;
}

export function createConversation(db: DB, title?: string): number {
  const info = db
    .prepare("INSERT INTO conversations (title) VALUES (?)")
    .run(title ?? "New conversation");
  return Number(info.lastInsertRowid);
}

export function persistMessage(
  db: DB,
  conversationId: number,
  role: "user" | "assistant",
  content: string,
  meta?: unknown,
): number {
  const info = db
    .prepare(
      "INSERT INTO messages (conversation_id, role, content, meta) VALUES (?, ?, ?, ?)",
    )
    .run(conversationId, role, content, meta ? JSON.stringify(meta) : null);
  const id = Number(info.lastInsertRowid);
  indexMessage(db, id, content);
  db.prepare(
    "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?",
  ).run(conversationId);
  return id;
}

function history(db: DB, conversationId: number): Msg[] {
  const rows = db
    .prepare(
      `SELECT role, content FROM messages WHERE conversation_id = ?
       ORDER BY id DESC LIMIT ?`,
    )
    .all(conversationId, HISTORY_LIMIT) as { role: "user" | "assistant"; content: string }[];
  return rows.reverse().map((r) => ({ role: r.role, content: r.content }));
}

function autoTitle(db: DB, conversationId: number, firstUserMessage: string): string {
  const existing = db
    .prepare("SELECT title FROM conversations WHERE id = ?")
    .get(conversationId) as { title: string };
  if (existing.title !== "New conversation") return existing.title;
  let t = firstUserMessage.replace(/\s+/g, " ").trim();
  if (t.length > 56) t = `${t.slice(0, 56).trimEnd()}…`;
  db.prepare("UPDATE conversations SET title = ? WHERE id = ?").run(t, conversationId);
  return t;
}

/**
 * Run one full chat turn: persist the user message, retrieve RAG context,
 * stream the model (letting it call tools up to MAX_TOOL_ROUNDS times),
 * persist the assistant reply. Events are pushed through `send`.
 */
export async function runChatTurn(
  db: DB,
  conversationId: number,
  userText: string,
  send: (e: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  persistMessage(db, conversationId, "user", userText);
  const conversationTitle = autoTitle(db, conversationId, userText);

  const ctx = buildChatContext(db, userText, conversationId);
  send({
    type: "context",
    librarySize: ctx.meta.librarySize,
    matches: ctx.meta.libraryMatches.slice(0, 5),
    memoryHits: ctx.meta.memoryHits,
  });

  const llm = getLlm();
  const model = currentModel(db);

  const messages: Msg[] = [
    { role: "system", content: luminaSystemPrompt(renderContextBlock(ctx)) },
    ...history(db, conversationId),
  ];

  const toolsUsed: string[] = [];
  const writeReceipts: string[] = [];
  let assistantText = "";

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    if (signal?.aborted) break;

    let roundText = "";
    const toolCalls = new Map<number, PendingToolCall>();
    let finishReason: string | null = null;

    try {
      const stream = await llm.chat.completions.create(
        {
          model,
          messages,
          tools: toolDefinitions,
          stream: true,
          temperature: 0.8,
        },
        { signal },
      );

      for await (const chunk of stream) {
        const choice = chunk.choices?.[0];
        if (!choice) continue;
        const delta = choice.delta;

        if (delta?.content) {
          roundText += delta.content;
          assistantText += delta.content;
          send({ type: "delta", text: delta.content });
        }
        for (const tc of delta?.tool_calls ?? []) {
          const idx = tc.index ?? 0;
          const existing =
            toolCalls.get(idx) ?? { id: "", name: "", arguments: "" };
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments) existing.arguments += tc.function.arguments;
          toolCalls.set(idx, existing);
        }
        if (choice.finish_reason) finishReason = choice.finish_reason;
      }
    } catch (err) {
      if (signal?.aborted) break; // user stopped — exit gracefully
      throw err;
    }

    if (finishReason === "tool_calls" && toolCalls.size > 0) {
      const calls = [...toolCalls.values()].filter((c) => c.name);
      messages.push({
        role: "assistant",
        content: roundText || null,
        tool_calls: calls.map((c) => ({
          id: c.id || `call_${Math.random().toString(36).slice(2, 10)}`,
          type: "function" as const,
          function: { name: c.name, arguments: c.arguments || "{}" },
        })),
      });

      for (const call of calls) {
        if (signal?.aborted) break;
        send({ type: "tool", name: call.name });
        toolsUsed.push(call.name);
        const result = await executeTool(db, call.name, call.arguments);
        const summary = WRITE_TOOLS.has(call.name)
          ? writeReceipt(call.name, result)
          : undefined;
        if (summary) writeReceipts.push(summary);
        send({ type: "tool_done", name: call.name, summary });
        messages.push({
          role: "tool",
          tool_call_id: call.id || `call_${Math.random().toString(36).slice(2, 10)}`,
          content: result,
        });
      }
      if (roundText) {
        assistantText += "\n\n";
        send({ type: "delta", text: "\n\n" });
      }
      continue;
    }
    break;
  }

  if (signal?.aborted) {
    // User stopped the turn: persist whatever streamed (marked), never invent more.
    if (assistantText.trim()) {
      persistMessage(db, conversationId, "assistant", assistantText, {
        toolsUsed,
        writeReceipts,
        stopped: true,
        model,
      });
    }
    return;
  }

  if (!assistantText.trim()) {
    assistantText =
      "I hit a snag generating a reply — please try again in a moment.";
    send({ type: "delta", text: assistantText });
  }

  const messageId = persistMessage(db, conversationId, "assistant", assistantText, {
    toolsUsed,
    writeReceipts,
    retrieved: ctx.meta,
    model,
  });
  send({ type: "done", messageId, conversationTitle });
}
