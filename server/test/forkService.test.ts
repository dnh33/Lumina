import { describe, it, expect, beforeEach } from "vitest";
import { createDb } from "../src/db/connection.js";
import { migrate } from "../src/db/schema.js";
import { createConversation, persistMessage } from "../src/llm/chatService.js";
import { createFork, getParentFork } from "../src/services/forkService.js";
import type { DB } from "../src/db/connection.js";

function freshDb(): DB {
  const db = createDb(":memory:");
  migrate(db);
  return db;
}

describe("forkService", () => {
  let db: DB;
  beforeEach(() => {
    db = freshDb();
  });

  it("copies parent messages up to the fork point into a new conversation", () => {
    const parent = createConversation(db, "Sci-fi deep dive");
    persistMessage(db, parent, "user", "Recommend a slow-burn sci-fi film");
    persistMessage(db, parent, "assistant", "Try 'Arrival' (2016)");
    persistMessage(db, parent, "user", "What about something with time loops?");
    persistMessage(db, parent, "assistant", "Consider 'Predestination' (2014)");

    const fork = createFork(db, parent, 1); // fork after 2nd message (index 1)

    // Child should have 2 messages (indices 0,1 inclusive)
    const childMsgs = db
      .prepare("SELECT COUNT(*) AS n FROM messages WHERE conversation_id = ?")
      .get(fork.child_conversation_id) as { n: number };
    expect(childMsgs.n).toBe(2);

    // Parent should be unchanged
    const parentMsgs = db
      .prepare("SELECT COUNT(*) AS n FROM messages WHERE conversation_id = ?")
      .get(parent) as { n: number };
    expect(parentMsgs.n).toBe(4);
  });

  it("records the fork link and exposes parent for list label", () => {
    const parent = createConversation(db, "Horror marathon");
    persistMessage(db, parent, "user", "Best folk horror?");
    persistMessage(db, parent, "assistant", "Start with 'The Wailing' (2016)");

    const fork = createFork(db, parent, 1, "My folk horror branch");

    expect(fork.parent_conversation_id).toBe(parent);
    expect(fork.label).toBe("My folk horror branch");

    const parentFork = getParentFork(db, fork.child_conversation_id);
    expect(parentFork?.parent_title).toBe("Horror marathon");
  });

  it("rejects a fork with no messages", () => {
    const empty = createConversation(db, "Empty");
    expect(() => createFork(db, empty, 0)).toThrow();
  });
});
