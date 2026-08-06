import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { GuidedTour } from "./GuidedTour.js";
import { resumeWhisperStorageKey } from "./guidedCurator.js";
import { libraryWatchlistPath } from "./tonightBag.js";
import type { GenreWorld } from "../../lib/genreWorld.js";
import type { GuidedSessionPayload } from "../../lib/types.js";

const world: GenreWorld = {
  slug: "documentary",
  metaphor: "Reading Room",
  register: {
    lexicon: ["evidence", "argument"],
    tonePrompt: "Curious, credible, analytical.",
    cueBeatMap: ["open"],
    accent: "#64748b",
    moods: ["curious"],
  },
  modules: ["timeline"],
};

const sessionPayload: GuidedSessionPayload = {
  session: {
    slug: "documentary",
    mediaType: "movie",
    status: "active",
    answers: {},
    picks: [
      {
        tmdbId: 1,
        mediaType: "movie",
        title: "Shelf Film",
        year: 2020,
        posterPath: "/x.jpg",
        voteAverage: 7,
        inLibrary: false,
      },
    ],
    acted: [],
    conversationId: null,
    createdAt: "2026-08-05T00:00:00.000Z",
    updatedAt: "2026-08-05T00:00:00.000Z",
  },
  beats: [
    {
      id: "tempo",
      prompt: "How should the argument unfold tonight?",
      choices: [
        { id: "slow", label: "Patient cut", hint: "Evidence that lingers" },
        { id: "mid", label: "Clear through-line", hint: "Steady" },
        { id: "kinetic", label: "Sharp cut", hint: "Forward" },
      ],
    },
    {
      id: "era",
      prompt: "Which archive shelf?",
      choices: [
        { id: "classic", label: "Classic", hint: "Before 1990" },
        { id: "turn", label: "Turn", hint: "1990-2009" },
        { id: "now", label: "Now", hint: "2010+" },
      ],
    },
    {
      id: "risk",
      prompt: "Known sources?",
      choices: [
        { id: "comfort", label: "Cited & sure", hint: "Sure" },
        { id: "stretch", label: "Fringe dossier", hint: "Edge" },
      ],
    },
  ],
};

vi.mock("../../lib/api.js", () => ({
  api: {
    guidedSession: vi.fn(),
    answerGuided: vi.fn(),
    guidedAct: vi.fn(),
    resetGuided: vi.fn(),
    genreExperience: vi.fn(),
  },
}));

vi.mock("../../lib/sound.js", () => ({
  getSoundEnabled: () => false,
}));

function renderTour(onSteerEra = vi.fn()) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <GuidedTour
        slug="documentary"
        mediaType="movie"
        world={world}
        onSteerEra={onSteerEra}
      />
    </QueryClientProvider>,
  );
}

describe("GuidedTour", () => {
  beforeEach(async () => {
    sessionStorage.clear();
    const { api } = await import("../../lib/api.js");
    vi.mocked(api.guidedSession).mockReset();
    vi.mocked(api.answerGuided).mockReset();
    vi.mocked(api.guidedAct).mockReset();
    vi.mocked(api.resetGuided).mockReset();
    vi.mocked(api.genreExperience).mockReset();
    vi.mocked(api.guidedSession).mockResolvedValue(sessionPayload);
    vi.mocked(api.answerGuided).mockResolvedValue({
      ...sessionPayload,
      session: {
        ...sessionPayload.session,
        answers: { tempo: "slow" },
      },
    });
    vi.mocked(api.guidedAct).mockResolvedValue(sessionPayload);
    vi.mocked(api.resetGuided).mockResolvedValue(sessionPayload);
    vi.mocked(api.genreExperience).mockResolvedValue({
      key: "test",
      genres: ["documentary"],
      mode: "guided",
      items: [],
      anchorsUsed: [],
      profileState: "thin",
    });
  });

  it("renders tour desk and metaphor-flavored beat choices", async () => {
    renderTour();
    expect(await screen.findByTestId("guided-tour")).toBeTruthy();
    expect(screen.getByText("Walk the stacks with me")).toBeTruthy();
    expect(screen.getByText(/Reading Room/)).toBeTruthy();
    expect(screen.getByText("How should the argument unfold tonight?")).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Patient cut/i })).toBeTruthy();
    expect(screen.getByText("Tonight shelf")).toBeTruthy();
    expect(screen.getByText("Shelf Film")).toBeTruthy();
    // Persistent next-step cue (no flash yet)
    expect(screen.getByTestId("guided-feedback").textContent).toMatch(/Your move/i);
    // Human dial nouns, not raw beat ids
    expect(screen.getByText("Tempo")).toBeTruthy();
    expect(screen.getByText("Up next")).toBeTruthy();
    // Retake hidden until a dial is answered
    expect(screen.queryByRole("button", { name: /Retake/i })).toBeNull();
    // Preview shelf caption
    expect(screen.getByTestId("guided-shelf").getAttribute("data-guided-shelf")).toBe(
      "preview",
    );
  });

  it("answers a beat via the API and shows ranking feedback", async () => {
    const { api } = await import("../../lib/api.js");
    const onOutcomeCue = vi.fn();
    const after: GuidedSessionPayload = {
      ...sessionPayload,
      session: {
        ...sessionPayload.session,
        answers: { tempo: "slow" },
      },
    };
    vi.mocked(api.answerGuided).mockResolvedValue(after);
    vi.mocked(api.answerGuided).mockImplementation(async () => {
      vi.mocked(api.guidedSession).mockResolvedValue(after);
      return after;
    });
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <GuidedTour
          slug="documentary"
          mediaType="movie"
          world={world}
          onOutcomeCue={onOutcomeCue}
        />
      </QueryClientProvider>,
    );
    await screen.findByTestId("guided-tour");
    fireEvent.click(screen.getByRole("radio", { name: /Patient cut/i }));
    await waitFor(() => {
      expect(api.answerGuided).toHaveBeenCalledWith({
        slug: "documentary",
        mediaType: "movie",
        beatId: "tempo",
        choiceId: "slow",
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId("guided-feedback").textContent).toMatch(/Tempo →/i);
    });
    expect(screen.getByTestId("guided-feedback").getAttribute("data-guided-flash")).toBe(
      "1",
    );
    expect(onOutcomeCue).toHaveBeenCalledWith(
      expect.stringMatching(/Guided · tempo/i),
    );
  });

  it("shows resume feedback once per browser session, not every remount", async () => {
    const { api } = await import("../../lib/api.js");
    const resumed: GuidedSessionPayload = {
      ...sessionPayload,
      session: {
        ...sessionPayload.session,
        answers: { tempo: "slow" },
      },
    };
    vi.mocked(api.guidedSession).mockResolvedValue(resumed);

    const first = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { unmount } = render(
      <QueryClientProvider client={first}>
        <GuidedTour slug="documentary" mediaType="movie" world={world} />
      </QueryClientProvider>,
    );
    expect(await screen.findByTestId("guided-feedback")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId("guided-feedback").textContent).toMatch(/Resuming/i);
    });
    expect(sessionStorage.getItem(resumeWhisperStorageKey("documentary", "movie"))).toBe(
      "1",
    );

    unmount();

    const second = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={second}>
        <GuidedTour slug="documentary" mediaType="movie" world={world} />
      </QueryClientProvider>,
    );
    await screen.findByTestId("guided-tour");
    const line = screen.getByTestId("guided-feedback");
    // Persistent next-step cue only — resume whisper must not fire again
    expect(line.getAttribute("data-guided-flash")).toBe("0");
    expect(line.textContent).not.toMatch(/Resuming/i);
    expect(line.textContent).toMatch(/Next:/i);
  });

  it("re-answers a prior dial without Retake", async () => {
    const { api } = await import("../../lib/api.js");
    const midTour: GuidedSessionPayload = {
      ...sessionPayload,
      session: {
        ...sessionPayload.session,
        status: "complete",
        answers: { tempo: "slow", era: "now", risk: "stretch" },
      },
    };
    vi.mocked(api.guidedSession).mockResolvedValue(midTour);
    vi.mocked(api.answerGuided).mockResolvedValue({
      ...midTour,
      session: {
        ...midTour.session,
        answers: { tempo: "kinetic", era: "now", risk: "stretch" },
      },
    });

    renderTour();
    await screen.findByTestId("guided-tour");
    expect(screen.queryByTestId("guided-active-dial")).toBeNull();
    expect(screen.getByTestId("guided-dial-hint-tempo").textContent).toMatch(
      /Tap to re-tune/i,
    );

    fireEvent.click(screen.getByTestId("guided-dial-tempo"));
    const activeDial = await screen.findByTestId("guided-active-dial");
    expect(activeDial).toBeTruthy();
    expect(activeDial.getAttribute("data-guided-dial-mode")).toBe("retune");
    // Retune sheet sits under the needle, before Tonight shelf (not buried below).
    const desk = screen.getByTestId("guided-tour");
    const dialPos = desk.innerHTML.indexOf('data-testid="guided-active-dial"');
    const shelfPos = desk.innerHTML.indexOf('data-testid="guided-shelf"');
    expect(dialPos).toBeGreaterThan(-1);
    expect(shelfPos).toBeGreaterThan(-1);
    expect(dialPos).toBeLessThan(shelfPos);
    expect(activeDial.textContent).toMatch(/Re-dial · Tempo/i);
    expect(screen.getByTestId("guided-dial-hint-tempo").textContent).toMatch(
      /Choosing/i,
    );
    expect(screen.getByTestId("guided-dial-choose-cue").textContent).toMatch(
      /Choose a new tempo setting/i,
    );
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBeGreaterThanOrEqual(2);
    expect(
      radios.some((r) => r.getAttribute("aria-checked") === "true"),
    ).toBe(true);
    expect(
      screen.getByRole("radiogroup").getAttribute("aria-describedby"),
    ).toBe("guided-dial-choose-cue");

    fireEvent.click(screen.getByRole("radio", { name: /Sharp cut/i }));
    await waitFor(() => {
      expect(api.answerGuided).toHaveBeenCalledWith({
        slug: "documentary",
        mediaType: "movie",
        beatId: "tempo",
        choiceId: "kinetic",
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId("guided-feedback").textContent).toMatch(/Tempo →/i);
    });
  });

  it("dial radiogroup arrows move focus and select (S4)", async () => {
    const { api } = await import("../../lib/api.js");
    const midTour: GuidedSessionPayload = {
      ...sessionPayload,
      session: {
        ...sessionPayload.session,
        answers: { tempo: "slow", era: "now", risk: "safe" },
        status: "complete",
      },
    };
    vi.mocked(api.guidedSession).mockResolvedValue(midTour);
    vi.mocked(api.answerGuided).mockResolvedValue({
      ...midTour,
      session: {
        ...midTour.session,
        answers: { tempo: "kinetic", era: "now", risk: "safe" },
      },
    });

    renderTour();
    await screen.findByTestId("guided-tour");
    fireEvent.click(screen.getByTestId("guided-dial-tempo"));
    await screen.findByTestId("guided-active-dial");
    const radios = screen.getAllByRole("radio");
    const selected = radios.find((r) => r.getAttribute("aria-checked") === "true");
    expect(selected).toBeTruthy();
    selected!.focus();
    fireEvent.keyDown(selected!, {
      key: "ArrowRight",
      bubbles: true,
    });
    await waitFor(() => {
      expect(api.answerGuided).toHaveBeenCalled();
    });
  });

  it("Era Now clears decade scrub instead of pinning 2010s", async () => {
    const { api } = await import("../../lib/api.js");
    const onSteerEra = vi.fn();
    const afterTempo: GuidedSessionPayload = {
      ...sessionPayload,
      session: {
        ...sessionPayload.session,
        answers: { tempo: "kinetic" },
      },
    };
    vi.mocked(api.guidedSession).mockResolvedValue(afterTempo);
    vi.mocked(api.answerGuided).mockResolvedValue({
      ...afterTempo,
      session: {
        ...afterTempo.session,
        answers: { tempo: "kinetic", era: "now" },
      },
    });

    renderTour(onSteerEra);
    await screen.findByTestId("guided-tour");
    fireEvent.click(screen.getByRole("radio", { name: /Now/i }));
    await waitFor(() => {
      expect(api.answerGuided).toHaveBeenCalledWith({
        slug: "documentary",
        mediaType: "movie",
        beatId: "era",
        choiceId: "now",
      });
    });
    expect(onSteerEra).toHaveBeenCalledWith(null);
    expect(onSteerEra).not.toHaveBeenCalledWith(2010);
  });

  it("CLAIM stage exposes shelf as hero and Widen / browse archive CTA", async () => {
    const { api } = await import("../../lib/api.js");
    const onWiden = vi.fn();
    const onStageChange = vi.fn();
    const complete: GuidedSessionPayload = {
      ...sessionPayload,
      session: {
        ...sessionPayload.session,
        status: "complete",
        answers: { tempo: "slow", era: "now", risk: "stretch" },
      },
    };
    vi.mocked(api.guidedSession).mockResolvedValue(complete);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <GuidedTour
          slug="documentary"
          mediaType="movie"
          world={world}
          onWiden={onWiden}
          onStageChange={onStageChange}
          leadThesis="Lead thesis collapses Featured into the shelf."
        />
      </QueryClientProvider>,
    );
    const desk = await screen.findByTestId("guided-tour");
    expect(desk.getAttribute("data-guided-stage")).toBe("claim");
    expect(desk.getAttribute("data-guided-pack")).toBe("claim-cockpit");
    expect(screen.getByTestId("guided-shelf").getAttribute("data-guided-shelf-role")).toBe(
      "hero",
    );
    expect(screen.queryByTestId("guided-active-dial")).toBeNull();
    expect(screen.getByTestId("shelf-lead-thesis").textContent).toMatch(
      /Lead thesis collapses Featured/,
    );
    // W2.3: Watchlist/Pass only on active (lead) cell — not dual chrome × N.
    expect(screen.getAllByTestId("shelf-cell-actions")).toHaveLength(1);
    expect(screen.getByTestId("shelf-cell-active")).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: /Add .+ to watchlist|already in library/i }),
    ).toHaveLength(1);
    // Claim fold: argue is deepen-only — no Featured / Argument competing.
    expect(screen.queryByTestId("guided-claim-argue")).toBeNull();
    expect(screen.queryByText("Featured")).toBeNull();
    expect(screen.queryByText("The argument")).toBeNull();
    const widen = screen.getByTestId("guided-desk-widen");
    expect(widen.textContent).toMatch(/Widen \/ browse archive/i);
    // S3: single Deepen path = Companion FAB — no competing desk Deepen CTA
    expect(
      screen.queryByRole("button", { name: /^Deepen$/i }),
    ).toBeNull();
    expect(screen.getByTestId("guided-complete").textContent).toMatch(
      /Deepen lives on the companion/i,
    );
    fireEvent.click(widen);
    expect(onWiden).toHaveBeenCalled();
    await waitFor(() => {
      expect(onStageChange).toHaveBeenCalledWith("claim");
    });
  });

  it("compact parks desk as browse status bar for Guided BROWSE", async () => {
    const { api } = await import("../../lib/api.js");
    const onCollapse = vi.fn();
    // Even with a fresh resume-eligible session, Widen keeps the honest stage line.
    sessionStorage.removeItem(resumeWhisperStorageKey("documentary", "movie"));
    const complete: GuidedSessionPayload = {
      ...sessionPayload,
      session: {
        ...sessionPayload.session,
        status: "complete",
        answers: { tempo: "slow", era: "now", risk: "stretch" },
      },
    };
    vi.mocked(api.guidedSession).mockResolvedValue(complete);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <GuidedTour
          slug="documentary"
          mediaType="movie"
          world={world}
          compact
          eraBand="Now band"
          onCollapseWiden={onCollapse}
        />
      </QueryClientProvider>,
    );
    const desk = await screen.findByTestId("guided-tour");
    expect(desk.getAttribute("data-guided-pack")).toBe("browse-bar");
    expect(desk.getAttribute("data-guided-stage")).toBe("browse");
    expect(screen.getByTestId("guided-browse-stage").textContent).toMatch(
      /Guided · archive · Now band/,
    );
    // W2.1 + gate sniff: one cue node — archive stage, never resume flash.
    expect(screen.queryByTestId("guided-feedback")).toBeNull();
    expect(screen.getByTestId("guided-browse-stage").textContent).not.toMatch(
      /Resumed|Resuming/i,
    );
    expect(screen.queryByTestId("guided-shelf")).toBeNull();
    expect(screen.getByTestId("guided-collapse-widen").textContent).toMatch(
      /Back to shelf/i,
    );
    fireEvent.click(screen.getByTestId("guided-collapse-widen"));
    expect(onCollapse).toHaveBeenCalled();
  });

  it("deepenOpen after complete → stage deepen; closed → claim; widen wins", async () => {
    const { api } = await import("../../lib/api.js");
    const onStageChange = vi.fn();
    const complete: GuidedSessionPayload = {
      ...sessionPayload,
      session: {
        ...sessionPayload.session,
        status: "complete",
        answers: { tempo: "slow", era: "now", risk: "stretch" },
      },
    };
    vi.mocked(api.guidedSession).mockResolvedValue(complete);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const { rerender } = render(
      <QueryClientProvider client={qc}>
        <GuidedTour
          slug="documentary"
          mediaType="movie"
          world={world}
          deepenOpen
          onStageChange={onStageChange}
        />
      </QueryClientProvider>,
    );

    const desk = await screen.findByTestId("guided-tour");
    expect(desk.getAttribute("data-guided-stage")).toBe("deepen");
    await waitFor(() => {
      expect(onStageChange).toHaveBeenCalledWith("deepen");
    });
    // Tonight bag / shelf still claim-home chrome — deepen is HUD stage only
    expect(screen.getByTestId("guided-shelf")).toBeTruthy();

    rerender(
      <QueryClientProvider client={qc}>
        <GuidedTour
          slug="documentary"
          mediaType="movie"
          world={world}
          deepenOpen={false}
          onStageChange={onStageChange}
        />
      </QueryClientProvider>,
    );
    expect(
      (await screen.findByTestId("guided-tour")).getAttribute("data-guided-stage"),
    ).toBe("claim");

    rerender(
      <QueryClientProvider client={qc}>
        <GuidedTour
          slug="documentary"
          mediaType="movie"
          world={world}
          deepenOpen
          compact
          onStageChange={onStageChange}
        />
      </QueryClientProvider>,
    );
    expect(
      (await screen.findByTestId("guided-tour")).getAttribute("data-guided-stage"),
    ).toBe("browse");
  });

  it("peer poster first tap activates only — no open act or navigate", async () => {
    const { api } = await import("../../lib/api.js");
    const onOpenTitle = vi.fn();
    const complete: GuidedSessionPayload = {
      ...sessionPayload,
      session: {
        ...sessionPayload.session,
        status: "complete",
        answers: { tempo: "slow", era: "now", risk: "stretch" },
        picks: [
          sessionPayload.session.picks[0],
          {
            tmdbId: 2,
            mediaType: "movie",
            title: "Peer Film",
            year: 2021,
            posterPath: "/y.jpg",
            voteAverage: 7.2,
            inLibrary: false,
          },
        ],
      },
    };
    vi.mocked(api.guidedSession).mockResolvedValue(complete);

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <GuidedTour
          slug="documentary"
          mediaType="movie"
          world={world}
          onOpenTitle={onOpenTitle}
        />
      </QueryClientProvider>,
    );

    await screen.findByTestId("guided-tour");
    expect(screen.getByRole("button", { name: /Add Shelf Film to watchlist/i })).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /Add Peer Film to watchlist/i }),
    ).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /^Peer Film/ }));

    expect(
      screen.getByRole("button", { name: /Add Peer Film to watchlist/i }),
    ).toBeTruthy();
    expect(screen.getAllByTestId("shelf-cell-actions")).toHaveLength(1);
    expect(api.guidedAct).not.toHaveBeenCalled();
    expect(onOpenTitle).not.toHaveBeenCalled();

    // Second poster tap still activates only — Open action owns navigate.
    fireEvent.click(screen.getByRole("button", { name: /^Peer Film/ }));
    expect(api.guidedAct).not.toHaveBeenCalled();
    expect(onOpenTitle).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^Open Peer Film$/i }));
    await waitFor(() => {
      expect(api.guidedAct).toHaveBeenCalledWith(
        expect.objectContaining({ action: "open", tmdbId: 2 }),
      );
    });
    expect(onOpenTitle).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 2, title: "Peer Film" }),
    );
  });

  it("after Watchlist success shows tonight-bag with Library link", async () => {
    const { api } = await import("../../lib/api.js");
    const complete: GuidedSessionPayload = {
      ...sessionPayload,
      session: {
        ...sessionPayload.session,
        status: "complete",
        answers: { tempo: "slow", era: "now", risk: "stretch" },
      },
    };
    const afterWatchlist: GuidedSessionPayload = {
      ...complete,
      session: {
        ...complete.session,
        picks: [
          {
            ...complete.session.picks[0],
            inLibrary: true,
          },
        ],
        acted: [
          {
            tmdbId: 1,
            mediaType: "movie",
            action: "watchlist",
            at: "2026-08-06T12:00:00.000Z",
          },
        ],
      },
    };
    vi.mocked(api.guidedSession).mockResolvedValue(complete);
    vi.mocked(api.guidedAct).mockImplementation(async () => {
      vi.mocked(api.guidedSession).mockResolvedValue(afterWatchlist);
      return afterWatchlist;
    });

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <GuidedTour
            slug="documentary"
            mediaType="movie"
            world={world}
          />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    await screen.findByTestId("guided-tour");
    expect(screen.queryByTestId("tonight-bag")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: /Add Shelf Film to watchlist/i }),
    );

    await waitFor(() => {
      expect(api.guidedAct).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "watchlist",
          tmdbId: 1,
        }),
      );
    });

    const bag = await screen.findByTestId("tonight-bag");
    expect(bag.textContent).toMatch(/Shelf Film/);
    const libLink = screen.getByRole("link", { name: /Open in Library/i });
    expect(libLink.getAttribute("href")).toBe(libraryWatchlistPath());
    expect(screen.getByRole("button", { name: /Stay on shelf/i })).toBeTruthy();
  });

  it("after dial reweight replaces stale shelf peers before act (no Aliens→400)", async () => {
    const { api } = await import("../../lib/api.js");
    const aliens = {
      tmdbId: 679,
      mediaType: "movie" as const,
      title: "Aliens",
      year: 1986,
      posterPath: "/a.jpg",
      voteAverage: 8,
      inLibrary: false,
    };
    const caliber = {
      tmdbId: 11645,
      mediaType: "movie" as const,
      title: "Caliber 9",
      year: 1972,
      posterPath: "/c.jpg",
      voteAverage: 7.4,
      inLibrary: false,
    };
    const rosemary = {
      tmdbId: 805,
      mediaType: "movie" as const,
      title: "Rosemary's Baby",
      year: 1968,
      posterPath: "/r.jpg",
      voteAverage: 7.8,
      inLibrary: false,
    };

    const beforeRisk: GuidedSessionPayload = {
      ...sessionPayload,
      session: {
        ...sessionPayload.session,
        status: "active",
        answers: { tempo: "slow", era: "classic" },
        picks: [aliens, rosemary],
      },
    };
    // answer endpoint updates answers only — picks still stale until rail refresh
    const answerPayload: GuidedSessionPayload = {
      ...beforeRisk,
      session: {
        ...beforeRisk.session,
        status: "complete",
        answers: { tempo: "slow", era: "classic", risk: "stretch" },
        picks: [aliens, rosemary],
      },
    };
    const afterReweight: GuidedSessionPayload = {
      ...answerPayload,
      session: {
        ...answerPayload.session,
        picks: [rosemary, caliber],
      },
    };

    vi.mocked(api.guidedSession).mockResolvedValue(beforeRisk);
    vi.mocked(api.answerGuided).mockResolvedValue(answerPayload);
    // genre-experience side-effect: refreshGuidedPicks persists new shelf
    vi.mocked(api.genreExperience).mockImplementation(async () => {
      vi.mocked(api.guidedSession).mockResolvedValue(afterReweight);
      return {
        key: "test",
        genres: ["documentary"],
        mode: "guided" as const,
        items: [],
        anchorsUsed: [],
        profileState: "thin" as const,
      };
    });
    vi.mocked(api.guidedAct).mockImplementation(async (body) => {
      const onShelf = afterReweight.session.picks.some(
        (p) => p.tmdbId === body.tmdbId,
      );
      if (!onShelf) {
        throw Object.assign(new Error("tmdbId not in guided picks"), {
          statusCode: 400,
        });
      }
      return {
        ...afterReweight,
        session: {
          ...afterReweight.session,
          acted: [
            {
              tmdbId: body.tmdbId,
              mediaType: "movie",
              action: body.action,
              at: "2026-08-06T12:00:00.000Z",
            },
          ],
          picks: afterReweight.session.picks.map((p) =>
            p.tmdbId === body.tmdbId ? { ...p, inLibrary: body.action === "watchlist" } : p,
          ),
        },
      };
    });

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <GuidedTour slug="documentary" mediaType="movie" world={world} />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    await screen.findByTestId("guided-tour");
    expect(screen.getByText("Aliens")).toBeTruthy();

    // Activate stale peer so actions would target Aliens if shelf desyncs
    fireEvent.click(screen.getByRole("button", { name: /^Aliens/ }));
    expect(
      screen.getByRole("button", { name: /Add Aliens to watchlist/i }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: /Fringe dossier/i }));

    await waitFor(() => {
      expect(api.answerGuided).toHaveBeenCalled();
      expect(api.genreExperience).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByText("Aliens")).toBeNull();
      expect(screen.getByText("Caliber 9")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Caliber 9/ }));
    fireEvent.click(
      screen.getByRole("button", { name: /Add Caliber 9 to watchlist/i }),
    );

    await waitFor(() => {
      expect(api.guidedAct).toHaveBeenCalledWith(
        expect.objectContaining({ action: "watchlist", tmdbId: 11645 }),
      );
    });
    expect(api.guidedAct).not.toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 679 }),
    );
  });
});
