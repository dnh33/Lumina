/**
 * Regression test for the ChatPage first-send remount race.
 *
 * BUG: on the /chat full-page route, sending the first message in a brand-new
 * conversation (conversationId == null) calls onConversationChange(newId) ->
 * navigate("/chat/" + newId). When App.tsx had TWO sibling routes (`/chat` and
 * `/chat/:id`) wrapped in `<motion.div key={location.pathname}>` inside
 * `<AnimatePresence mode="wait">`, that navigation crossed a route boundary and
 * REMOUNTED ChatPage. The outgoing useChat cleanup ran `abortRef.current?.abort()`
 * while the stream was in flight, killing the fetch before the reply arrived —
 * so the first send looked dead.
 *
 * FIX (must remain intact — do not revert):
 *   - App.tsx uses a single `<Route path="/chat/*" element={<ChatPage />} />` and
 *     the motion.div key is stable ("chat") across /chat and /chat/:id, so the
 *     navigate RE-RENDERS ChatPage (param change) instead of remounting it.
 *   - ChatPage reads the id via the `/chat/*` splat (useParams), so the
 *     conversation id is a prop-derived value, not a routing-boundary change.
 *
 * Discriminator: render the REAL App at `/chat` (null conversation), send a
 * message. send() resolves createConversation, then onConversationChange() fires
 * the navigate to `/chat/:id` — exactly the transition that, under the bug,
 * remounts ChatPage and aborts the in-flight stream. We capture the AbortSignal
 * handed to streamChat and assert it stays live across that navigation. Under
 * the bug the remount-abort flips it to `aborted`; under the fix it does not.
 *
 * Note: the stream mock never resolves, so the turn is genuinely in-flight while
 * the navigation (and any remount) occurs. We read the router location through a
 * probe (MemoryRouter does not sync window.location).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// framer-motion caches reduced-motion in a module singleton; force it off so
// AnimatePresence/motion behave deterministically under jsdom.
import { prefersReducedMotion, hasReducedMotionListener } from "motion-dom";

import App from "./App";

// Capture the AbortSignal the app passes to streamChat so we can assert, after
// the first-send navigation, whether the in-flight stream was aborted.
const capturedSignals: AbortSignal[] = [];

// Probe that records the live router location (MemoryRouter doesn't touch
// window.location, so we can't read it from there).
let currentPath = "";
function LocationProbe() {
  const loc = useLocation();
  currentPath = loc.pathname;
  return null;
}

// streamChat returns a promise we never resolve → the turn stays in-flight while
// we perform the navigate that the first send triggers.
const pendingStream = new Promise<void>(() => {});

vi.mock("./lib/api", () => ({
  api: {
    health: async () => ({ aiConfigured: true, version: "test" }),
    conversations: async () => [],
    createConversation: async () => ({ id: 999 }),
    messages: async () => [],
    renameConversation: async () => ({ ok: true }),
    deleteConversation: async () => {},
  },
  streamChat: async (
    _conversationId: number,
    _content: string,
    _onEvent: (e: unknown) => void,
    signal?: AbortSignal,
  ): Promise<void> => {
    if (signal) capturedSignals.push(signal);
    await pendingStream;
    return;
  },
}));

vi.mock("./lib/sound", () => ({
  initSound: () => {},
  playCue: () => {},
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  capturedSignals.length = 0;
  currentPath = "";
  prefersReducedMotion.current = false;
  hasReducedMotionListener.current = true;
});

function renderAppAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <App />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ChatPage first-send remount race (regression)", () => {
  it("does NOT abort the in-flight stream when the first send navigates /chat → /chat/:id", async () => {
    // Render at /chat (null conversation) — the exact starting state of a first
    // send in a new conversation.
    renderAppAt("/chat");

    const textarea = await waitFor(() =>
      screen.getByPlaceholderText(/Ask about anything/i),
    );

    // Submit a message. send() resolves createConversation (id 999), then calls
    // onConversationChange(999) -> navigate("/chat/999") — the transition that,
    // under the bug, remounts ChatPage and aborts the stream. The stream stays
    // pending (mock never resolves), so it is genuinely in-flight.
    fireEvent.change(textarea, { target: { value: "recommend a slow-burn sci-fi" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    // streamChat was invoked (turn is in flight) and handed us an AbortSignal.
    await waitFor(() => expect(capturedSignals.length).toBeGreaterThan(0));
    const signal = capturedSignals[0];
    expect(signal.aborted).toBe(false);

    // The first send's auto-navigation to /chat/999 must have occurred.
    await waitFor(() => expect(currentPath).toBe("/chat/999"));

    // Let the remount (buggy) or re-render (fixed) fully settle.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Core regression assertion: the in-flight stream must NOT have been aborted
    // by the navigation. Under the bug, the remount's useChat cleanup fires
    // abortRef.current?.abort() and this signal becomes aborted.
    expect(signal.aborted).toBe(false);
  });
});
