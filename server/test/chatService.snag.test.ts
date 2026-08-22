import { describe, it, expect, vi } from "vitest";
import { memoryDb } from "./helpers.js";

/** SNAG mirror of chatService.ts's SNAG_MESSAGE — must match exactly. */
const SNAG = "I hit a snag generating a reply — please try again in a moment.";

/**
 * Build a fake OpenRouter client that pulls responses from `queue` in order.
 * Index 0 = streaming call (tool loop), index 1 = non-streaming retry.
 * Empty text simulates a timeout/rate-limit (no usable completion).
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

describe("runChatTurn — snag persistence cleanup", () => {
  it("removes a persisted snag when a later turn resolves", async () => {
    const db = memoryDb();

    // turn 1: stream empty + retry empty  -> SNAG persisted
    // turn 2: stream empty + retry valid   -> SNAG removed, valid kept
    const queue: Array<{ text: string }> = [
      { text: "" },
      { text: "" },
      { text: "" },
      { text: "Here is your answer." },
    ];
    const fake = fakeLlm(queue);

    vi.doMock("../src/llm/openrouter.js", () => ({
      getLlm: () => fake,
      currentModel: () => "test-model",
      formatChatLlmError: (e: unknown) => String(e),
    }));

    const { runChatTurn, createConversation } = await import(
      "../src/llm/chatService.js"
    );

    const convId = createConversation(db);
    const sink = () => {};

    await runChatTurn(db, convId, "Hello", sink);
    expect(assistantContents(db, convId)).toContain(SNAG);

    await runChatTurn(db, convId, "Hello again", sink);
    const after = assistantContents(db, convId);
    expect(after).not.toContain(SNAG);
    expect(after).toContain("Here is your answer.");
  });
});
