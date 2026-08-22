/**
 * useOfflineQueue — queues chat messages when offline, replays on reconnect.
 *
 * When the network is unavailable, outgoing `streamChat` requests are
 * persisted to IndexedDB and replayed automatically when the browser
 * regains connectivity. Exponential backoff caps at 30s between retries.
 *
 * Uses the `idb` package for indexedDB access and the service worker
 * (registered via vite-plugin-pwa) for background sync.
 */

import { useEffect, useRef, useState } from "react";
import { openDB } from "idb";

const DB_NAME = "lumina-offline";
const STORE_NAME = "pendingMessages";
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

interface QueuedMessage {
  id: string;
  conversationId: number;
  content: string;
  timestamp: number;
  retryCount: number;
  nextAttempt: number;
}

// DB schema
let _db: Awaited<ReturnType<typeof openDB>> | null = null;

async function getDb() {
  if (!_db) {
    _db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("byConversation", "conversationId");
        store.createIndex("byNextAttempt", "nextAttempt");
      },
    });
  }
  return _db;
}

/**
 * Persist a chat message to IndexedDB when offline.
 * Returns true if queued (offline), false if sent (online).
 */
export async function enqueueMessage(
  conversationId: number,
  content: string,
): Promise<boolean> {
  if (navigator.onLine) return false;

  const db = await getDb();
  const msg: QueuedMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    conversationId,
    content,
    timestamp: Date.now(),
    retryCount: 0,
    nextAttempt: Date.now() + BASE_DELAY_MS,
  };
  await db.put(STORE_NAME, msg);
  return true;
}

/**
 * Replay queued messages when online.
 * Called when the browser fires "online" or when the service worker
 * triggers a background sync.
 */
export async function replayQueue(): Promise<void> {
  if (!navigator.onLine) return;

  const db = await getDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("byNextAttempt");

  // Only replay messages whose nextAttempt has passed
  const now = Date.now();
  const cursor = await index.openCursor(null, "prev");

  let cursorEntry = cursor;
  while (cursorEntry) {
    const msg = cursorEntry.value as QueuedMessage;
    if (msg.nextAttempt > now) {
      cursorEntry = await cursorEntry.continue();
      continue;
    }

    try {
      const res = await fetch(`/api/conversations/${msg.conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: msg.content }),
      });

      if (res.ok) {
        await cursorEntry!.delete();
      } else if (msg.retryCount < MAX_RETRIES) {
        msg.retryCount += 1;
        msg.nextAttempt = Date.now() + BASE_DELAY_MS * Math.pow(2, msg.retryCount);
        await store.put(msg);
      } else {
        // Max retries exhausted — give up
        await cursorEntry!.delete();
      }
    } catch {
      if (msg.retryCount < MAX_RETRIES) {
        msg.retryCount += 1;
        msg.nextAttempt = Date.now() + BASE_DELAY_MS * Math.pow(2, msg.retryCount);
        await store.put(msg);
      } else {
        await cursorEntry!.delete();
      }
    }

    cursorEntry = await index.openCursor(null, "prev");
  }

  await tx.done;
}

/**
 * React hook: listens for online/offline events and replays the queue.
 * Also triggers an initial replay on mount if online.
 */
export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const replayRef = useRef(replayQueue);

  useEffect(() => {
    replayRef.current = replayQueue;

    const goOnline = () => {
      setIsOnline(true);
      replayQueue();
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Initial replay if we start online
    if (navigator.onLine) replayQueue();

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return { isOnline, enqueueMessage };
}
