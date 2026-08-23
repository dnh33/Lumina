import type OpenAI from "openai";
import type { DB } from "../db/connection.js";
import { buildChatContext, renderContextBlock } from "../rag/contextBuilder.js";
import { needsCompression, compressHistory } from "../rag/summarization.js";
import { extractSignalsFromMessage } from "../services/feedbackExtractor.js";
import { indexMessage } from "../rag/memory.js";
import { syncGuidedWatchlistFromChat } from "../services/guidedSessionService.js";
import type { MediaType } from "../tmdb/types.js";
import { currentModel, getLlm, formatChatLlmError } from "./openrouter.js";
import { luminaSystemPrompt } from "./prompts.js";
import { executeTool, toolDefinitions } from "./tools.js";
import { toolDetail, toolOutcome } from "./toolPresenter.js";

const MAX_TOOL_ROUNDS = 3;
const MIN_RETRY_LENGTH = 40; // below this, retry text is unusable stubs
const HISTORY_LIMIT = 30;

/**
 * Emitted (and persisted) when a turn yields no usable text even after the
 * in-turn retry. Must stay constant: the trailing-snag cleanup below matches
 * on this exact string to avoid deleting a real assistant message.
 */
const SNAG_MESSAGE =
  "I hit a snag generating a reply — please try again in a moment.";

/** Remove a persisted snag message from the tail of a conversation, if present.
 * Called before persisting a real answer so a prior failed turn (or a client
 * "Retry" that re-ran the turn) never lingers above the resolved reply. */
function deleteTrailingSnag(db: DB, conversationId: number): void {
  const row = db
    .prepare(
      `SELECT id, role, content FROM messages
       WHERE conversation_id = ? ORDER BY id DESC LIMIT 1`,
    )
    .get(conversationId) as
    | { id: number; role: string; content: string }
    | undefined;
  if (!row || row.role !== "assistant" || row.content !== SNAG_MESSAGE) return;
  db.prepare("DELETE FROM messages_fts WHERE rowid = ?").run(row.id);
  db.prepare("DELETE FROM messages WHERE id = ?").run(row.id);
}

export type ChatEvent =
  | { type: "context"; librarySize: number; matches: string[]; memoryHits: number; dormant: boolean; summaryText: string | null }
  | { type: "delta"; text: string }
  | { type: "tool"; name: string; detail?: string }
  | { type: "tool_done"; name: string; summary?: string; detail?: string; outcome?: string }
  | { type: "done"; messageId: number; conversationTitle: string }
  | { type: "error"; message: string; retryAttempted?: boolean };

/** One persisted trace entry: what a tool call did, in human terms. */
export interface ToolTraceEntry {
  name: string;
  /** Salient argument ("“korean thrillers”"). */
  detail?: string;
  /** Result digest ("8 results", "Counterpart (2018)"). */
  outcome?: string;
  /** Write receipt, when the call mutated the library. */
  summary?: string;
}

/** Tools that mutate the library — their results become visible receipts. */
const WRITE_TOOLS = new Set([
  "add_to_library",
  "update_library_entry",
  "set_episode_progress",
]);

/**
 * Companion → guided: when add_to_library succeeds on a linked tour conversation,
 * mirror watchlist onto the same settings session (no second store).
 */
function mirrorGuidedWatchlist(
  db: DB,
  conversationId: number,
  argsJson: string,
  resultJson: string,
): void {
  try {
    const result = JSON.parse(resultJson) as { saved?: boolean };
    if (!result.saved) return;
    const args = JSON.parse(argsJson || "{}") as {
      tmdb_id?: unknown;
      media_type?: unknown;
      status?: unknown;
    };
    const status = typeof args.status === "string" ? args.status : "watchlist";
    if (status !== "watchlist") return;
    const tmdbId = Number(args.tmdb_id);
    const mediaType = args.media_type === "tv" ? "tv" : "movie";
    if (!Number.isFinite(tmdbId) || tmdbId <= 0) return;
    syncGuidedWatchlistFromChat(db, conversationId, tmdbId, mediaType as MediaType);
  } catch {
    /* never break the chat turn for guided sync */
  }
}

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
  // Clean up any snag persisted by a prior failed attempt of this turn
  // (including a client "Retry" that re-ran runChatTurn) so the resolved
  // reply never sits below a stale "I hit a snag…" on reload. Must run
  // *before* the new user message is persisted, or the snag falls off the tail.
  deleteTrailingSnag(db, conversationId);
  persistMessage(db, conversationId, "user", userText);
  const conversationTitle = autoTitle(db, conversationId, userText);

  const ctx = buildChatContext(db, userText, conversationId);
  send({
    type: "context",
    librarySize: ctx.meta.librarySize,
    matches: ctx.meta.libraryMatches.slice(0, 5),
    memoryHits: ctx.meta.memoryHits,
    dormant: ctx.meta.dormant,
    summaryText: ctx.summaryText || null,
  });

  const llm = getLlm();
  const model = currentModel(db);

  const messages: Msg[] = [
    { role: "system", content: luminaSystemPrompt(renderContextBlock(ctx)) },
    ...history(db, conversationId),
  ];

  const toolsUsed: string[] = [];
  const toolTrace: ToolTraceEntry[] = [];
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
          temperature: 0.2,
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
        // Human fragments for the trace UI: WHAT the call is doing (from its
        // args) now, and what it FOUND (from its result) once done. Never raw JSON.
        const detail = toolDetail(call.name, call.arguments || "{}");
        send({ type: "tool", name: call.name, detail });
        toolsUsed.push(call.name);
        const result = await executeTool(db, call.name, call.arguments);
        if (call.name === "add_to_library") {
          mirrorGuidedWatchlist(db, conversationId, call.arguments, result);
        }
        const summary = WRITE_TOOLS.has(call.name)
          ? writeReceipt(call.name, result)
          : undefined;
        if (summary) writeReceipts.push(summary);
        const outcome = toolOutcome(call.name, result);
        toolTrace.push({ name: call.name, detail, outcome, summary });
        send({ type: "tool_done", name: call.name, summary, detail, outcome });
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
        toolTrace,
        writeReceipts,
        stopped: true,
        model,
      });
    }
    return;
  }

  // If the model returned no text at all, it likely timed out or hit a rate
  // limit — NOT a hallucination. Retry once with a lighter payload (no tools,
  // lower max_tokens). If that also produces nothing, emit a descriptive error.
  if (!assistantText.trim()) {
    if (signal?.aborted) return; // user stopped — don't emit a snag message
    send({ type: "delta", text: "Let me try that again..." });
    try {
      const retry = await llm.chat.completions.create(
        {
          model,
          messages,
          temperature: 0.3,
          max_tokens: 512,
        },
        { signal },
      );
      assistantText =
        retry.choices[0]?.message?.content?.trim() ?? "";
      if (assistantText) {
        send({ type: "delta", text: assistantText });
      }
    } catch (retryErr) {
      send({ type: "error", message: formatChatLlmError(retryErr, model), retryAttempted: true });
      return;
    }
    // If retry produced nothing (or too-short stub e.g. 25 chars), don't
    // persist a stub. Surface a recoverable error so the client shows
    // "Lumina is trying again…" with a retry button.
    const retryLen = assistantText.length;
    if (!assistantText.trim() || retryLen < MIN_RETRY_LENGTH) {
      send({
        type: "error",
        message: assistantText
          ? `Retry produced only ${retryLen} chars — try again.`
          : "Retry produced no response.",
        retryAttempted: true,
      });
      assistantText = SNAG_MESSAGE;
    }
    send({ type: "delta", text: "\n" });
  }

  const messageId = persistMessage(db, conversationId, "assistant", assistantText, {
    toolsUsed,
    toolTrace,
    writeReceipts,
    retrieved: ctx.meta,
    model,
  });
  send({ type: "done", messageId, conversationTitle });

  // Trigger rolling summary compression if conversation exceeds HISTORY_LIMIT.
  // Fire-and-forget — don't block the response. The next turn picks up the
  // compressed summary from the context block.
  if (needsCompression(db, conversationId)) {
    void compressHistory(db, conversationId).catch(() => {
      /* never break the chat turn for summarization */
    });
  }

  // Taste feedback extraction — scan the user's last message for explicit
  // correction/preference patterns. Fire-and-forget (post-turn), never blocks.
  void extractSignalsFromMessage(db, conversationId, userText).catch(() => {
    /* never break the chat turn for feedback extraction */
  });
}
