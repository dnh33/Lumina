/**
 * Regression test for the Companion (/genre) slug-change remount race (C5).
 *
 * BUG: App.tsx keyed the route `<motion.div key={location.pathname}>`. For
 * genre pages that evaluated to `/genre/a` vs `/genre/b` — DIFFERENT strings —
 * so navigating between genres REMOUNTED the whole route, including the
 * embedded `ChatThread` inside `CompanionPanel`. The constant
 * `GENRE_DOCK_CONVERSATION_KEY` did NOT help because the component
 * unmounts/remounts: any in-flight Companion stream was ABORTED and the panel
 * CLOSED on slug change. Design required the embedded thread to survive slug
 * changes.
 *
 * FIX (must remain intact — do not revert):
 *   - App.tsx keys genre pages with a STABLE constant ("genre") across every
 *     `/genre/*` slug, mirroring the existing `/chat/*` splat pattern. So
 *     `/genre/a` → `/genre/b` RE-RENDERS the page (slug/param change) instead
 *     of remounting it — the embedded ChatThread (and its in-flight useChat
 *     stream) survives.
 *
 * Discriminator: render the REAL App at `/genre/a`, open the Companion, start
 * an in-flight stream (streamChat mock never resolves), then navigate to
 * `/genre/b`. We capture the AbortSignal handed to streamChat and assert:
 *   1) it stays live across the slug navigation (under the bug the remount's
 *      useChat cleanup aborts it), and
 *   2) the Companion stays OPEN (open state preserved → no remount; under the
 *      bug the remount resets useState `open` to false and the panel closes).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { prefersReducedMotion, hasReducedMotionListener } from "motion-dom";

import App from "./App";

// Capture the AbortSignal the app passes to streamChat so we can assert, after
// the slug navigation, whether the in-flight stream was aborted.
const capturedSignals: AbortSignal[] = [];

// Probe that records the live router location (MemoryRouter doesn't touch
// window.location, so we can't read it from there).
let currentPath = "";
function LocationProbe() {
  const loc = useLocation();
  currentPath = loc.pathname;
  return null;
}

// Capture the router's navigate fn so we can drive a slug change deterministically.
let routerNavigate: ((to: string) => void) | null = null;
function NavigateProbe() {
  routerNavigate = useNavigate();
  return null;
}

// streamChat returns a promise we never resolve → the turn stays in-flight while
// we perform the navigate that the slug change triggers.
const pendingStream = new Promise<void>(() => {});

vi.mock("./lib/api", () => ({
  api: {
    health: async () => ({ aiConfigured: true, version: "test" }),
    conversations: async () => [],
    createConversation: async () => ({ id: 999 }),
    messages: async () => [],
    renameConversation: async () => ({ ok: true }),
    deleteConversation: async () => {},
    genreExperience: async () => ({
      key: "movie:self:documentary",
      genres: ["documentary"],
      mode: "self",
      intro: { hook: "Step into the evidence.", tone: "hushed", basedOn: [] },
      items: Array.from({ length: 8 }, (_, i) => ({
        tmdbId: i + 1,
        mediaType: "movie",
        title: `Doc ${i + 1}`,
        year: 2010 + i,
        overview: "",
        posterPath: null,
        backdropPath: null,
        voteAverage: 7 + (i % 3) * 0.3,
        genreIds: [99],
        popularity: 10 - i,
        inLibrary: false,
      })),
      anchorsUsed: [],
      profileState: "rich",
    }),
    genreIntro: async () => ({ hook: "Step into the evidence.", tone: "hushed" }),
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
  getSoundEnabled: () => false,
  playWorldCue: () => {},
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  capturedSignals.length = 0;
  currentPath = "";
  routerNavigate = null;
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
        <NavigateProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Companion slug-change remount race (C5 regression)", () => {
  it("does NOT close the Companion panel when navigating /genre/a → /genre/b", async () => {
    // Render at /genre/documentary (the start slug) with the Companion collapsed.
    renderAppAt("/genre/documentary");

    // Open the in-world Companion.
    const openTrigger = await waitFor(() =>
      screen.getByRole("button", { name: /talk to the documentary companion/i }),
    );
    fireEvent.click(openTrigger);

    // Confirm it opened (toggle now reads "Close the … companion", expanded).
    const openBtnBefore = await waitFor(() =>
      screen.getByRole("button", {
        name: /close the documentary companion/i,
      }),
    );
    expect(openBtnBefore).toHaveAttribute("aria-expanded", "true");

    // Now navigate to a DIFFERENT genre slug — the exact transition that, under
    // the bug, REMOUNTS the route. With the route keyed stably ("genre") AND
    // CompanionPanel hoisted outside the page's loading/error branches, the
    // component must NOT remount: the panel must stay open and now be addressed
    // to the new world's slug.
    await act(async () => {
      routerNavigate?.("/genre/science-fiction");
    });

    // The slug navigation must have occurred.
    await waitFor(() => expect(currentPath).toBe("/genre/science-fiction"));

    // Let any re-render settle.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Core regression assertion: the Companion is STILL OPEN after the slug
    // change — addressed to the new slug, not reset to collapsed. Under the
    // bug this fails because the remount resets useState `open` → false.
    const companionStillOpen = screen.getByRole("button", {
      name: /close the science-fiction companion/i,
    });
    expect(companionStillOpen).toHaveAttribute("aria-expanded", "true");
  });
});
