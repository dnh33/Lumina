import { describe, it, expect, vi, beforeEach } from "vitest";
import { memoryDb } from "./helpers.js";

/** SNAG mirror of chatService.ts's SNAG_MESSAGE — must match exactly. */
const SNAG = "I hit a snag generating a reply — please try again in a moment.";

/**
 * Build a fake OpenRouter client that pulls responses from `queue` in order.
 * Each `create` call consumes one entry: even indices = streaming (tool loop),
 * odd indices = non-streaming retry. Empty text simulates timeout/rate-limit.
 * The instance is cached via the mock factory closure so `getLlm()` returns
 * the SAME fake across multiple `runChatTurn` calls within one test.
 */
function fakeLlm(queue: Array<{ text: string }>) {
  let i = 0;
  return {
    chat: {
      completions: {
        create: async (opts: { stream?: boolean }) => {
          const r = queue[i++] ?? { text: "" };
          const chunks = r.text
            ? [{ choices: [{ delta: { content: r.text }, finish_reason: "stop" }] }]
            : [{ choices: [{ delta: {}, finish_reason: null }] }];
          if (opts.stream) {
            // @ts-expect-error minimal async-iterable stub
            return {
              async *[Symbol.asyncIterator]() {
                for (const c of chunks) yield c;
              },
            };
          }
          return { choices: [{ message: { content: r.text, role: "assistant" } }] };
        },
      },
    },
  };
}

function assistantContents(db: import("../src/db/connection.js").DB, convId: number) {
  const rows = db
    .prepare(
      "SELECT content FROM messages WHERE conversation_id = ? AND role = 'assistant' ORDER BY id",
    )
    .all(convId) as { content: string }[];
  return rows.map((r) => r.content);
}

/** Wire the openrouter mock so getLlm() returns a single cached instance. */
function mockOpenrouter(queue: Array<{ text: string }>) {
  const ll = fakeLlm(queue);
  vi.doMock("../src/llm/openrouter.js", () => ({
    getLlm: () => ll,
    currentModel: () => "test-model",
    formatChatLlmError: (e: unknown) => String(e),
  }));
}

describe("runChatTurn — snag persistence cleanup", () => {
  beforeEach(() => vi.resetModules());

  it("removes a persisted snag when a later turn resolves", async () => {
    const db = memoryDb();
    const queue: Array<{ text: string }> = [
      { text: "" },
      { text: "" },
      { text: "" },
      { text: "Let me look into that. Based on your library, I recommend **Arrival** (2016) — a thoughtful sci-fi about time and communication." },
    ];
    mockOpenrouter(queue);

    const { runChatTurn, createConversation } = await import("../src/llm/chatService.js");
    const convId = createConversation(db);
    const sink = () => {};

    await runChatTurn(db, convId, "Hello", sink);
    expect(assistantContents(db, convId)).toContain(SNAG);
    await runChatTurn(db, convId, "Hello again", sink);
    const after = assistantContents(db, convId);
    expect(after).not.toContain(SNAG);
    expect(after.some((s) => s.includes("Based on your library, I recommend"))).toBe(true);
  });

  it("emits error with retryAttempted when retry returns too-short text", async () => {
    const db = memoryDb();
    const events: unknown[] = [];
    const queue: Array<{ text: string }> = [
      { text: "" },
      { text: "ok" },
    ];
    mockOpenrouter(queue);

    const { runChatTurn, createConversation } = await import("../src/llm/chatService.js");
    const convId = createConversation(db);
    await runChatTurn(db, convId, "Hi", (e) => events.push(e));

    const errorEvt = events.find(
      (e) => (e as { type?: string }).type === "error",
    ) as { message: string; retryAttempted?: boolean } | undefined;
    expect(errorEvt).toBeDefined();
    expect(errorEvt?.retryAttempted).toBe(true);
    expect(assistantContents(db, convId)).toContain(SNAG);
  });

  it("does not delete a real assistant message on a successful turn", async () => {
    const db = memoryDb();
    const queue: Array<{ text: string }> = [
      { text: "A real reply from the model." },
    ];
    mockOpenrouter(queue);

    const { runChatTurn, createConversation, persistMessage } = await import("../src/llm/chatService.js");
    const convId = createConversation(db);
    // Prep a prior real assistant message — deleteTrailingSnag must NOT touch it
    persistMessage(db, convId, "assistant", "A prior useful answer.", {});
    await runChatTurn(db, convId, "Hi", () => {});

    const after = assistantContents(db, convId);
    expect(after).toContain("A prior useful answer.");
    expect(after).toContain("A real reply from the model.");
    expect(after).not.toContain(SNAG);
  });
});
