import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock idb
const mockStore = {
  put: vi.fn(),
  delete: vi.fn(),
  index: vi.fn(),
  openCursor: vi.fn(),
};
const mockTx = {
  objectStore: vi.fn(() => mockStore),
  done: Promise.resolve(),
};
const mockDb = {
  transaction: vi.fn(() => mockTx),
  put: vi.fn(),
};

vi.mock("idb", () => ({
  openDB: vi.fn(() => Promise.resolve(mockDb)),
}));

// Mock navigator.onLine
let online = true;
Object.defineProperty(navigator, "onLine", {
  get: () => online,
  configurable: true,
});

import { enqueueMessage, replayQueue } from "./useOfflineQueue";

describe("enqueueMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    online = true;
  });

  it("returns false when online (no queueing needed)", async () => {
    const result = await enqueueMessage(1, "hello");
    expect(result).toBe(false);
    expect(mockDb.put).not.toHaveBeenCalled();
  });

  it("queues message to IndexedDB when offline", async () => {
    online = false;
    const result = await enqueueMessage(42, "queued question");
    expect(result).toBe(true);
    expect(mockDb.put).toHaveBeenCalledTimes(1);
    const [storeName, msg] = mockDb.put.mock.calls[0];
    expect(storeName).toBe("pendingMessages");
    expect(msg.conversationId).toBe(42);
    expect(msg.content).toBe("queued question");
    expect(msg.retryCount).toBe(0);
    expect(msg.nextAttempt).toBeGreaterThan(0);
  });

  it("generates a unique id per message", async () => {
    online = false;
    await enqueueMessage(1, "first");
    await enqueueMessage(1, "second");
    const [_, msg1] = mockDb.put.mock.calls[0];
    const [__, msg2] = mockDb.put.mock.calls[1];
    expect(msg1.id).not.toBe(msg2.id);
  });
});

describe("replayQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    online = true;
  });

  it("does nothing when offline", async () => {
    online = false;
    // Mock fetch
    global.fetch = vi.fn();
    await replayQueue();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does nothing when online but no messages queued", async () => {
    online = true;
    mockStore.index.mockReturnValue({
      openCursor: vi.fn().mockResolvedValue(null),
    });
    mockTx.objectStore.mockReturnValue(mockStore);
    global.fetch = vi.fn();
    await replayQueue();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
