import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, act, waitFor } from "@testing-library/react";
import { CompanionPanel } from "./CompanionPanel";
import { getGenreWorld, type GenreWorld } from "../../lib/genreWorld";
import {
  DOCK_CONVERSATION_KEY,
  GENRE_DOCK_CONVERSATION_KEY,
  genreCompanionConversationKey,
} from "../../lib/keys";
import { api } from "../../lib/api";

// Capture the props CompanionPanel hands to ChatThread so we can assert the
// conversation id (sourced from the dedicated genre key) and the diegetic
// welcome suggestions without booting the whole chat stack.
let lastProps: any = null;
vi.mock("../chat/ChatThread", () => ({
  ChatThread: (props: any) => {
    lastProps = props;
    return (
      <div data-testid="chat-thread" data-open={String(!!props)}>
        {/* surface a couple of props for DOM assertions */}
        <span data-testid="ct-id">{String(props.conversationId)}</span>
        <span data-testid="ct-prefill">{props.prefill ?? ""}</span>
        <span data-testid="ct-compact">{String(!!props.compact)}</span>
      </div>
    );
  },
}));

vi.mock("../../lib/api", () => ({
  api: {
    guidedSession: vi.fn(),
    linkGuided: vi.fn(),
  },
}));

function renderPanel(
  world: GenreWorld,
  opts: { guided?: boolean; mediaType?: "movie" | "tv" } = {},
) {
  return render(
    <CompanionPanel
      world={world}
      guided={opts.guided}
      mediaType={opts.mediaType}
    />,
  );
}

beforeEach(() => {
  localStorage.clear();
  lastProps = null;
  vi.mocked(api.guidedSession).mockReset();
  vi.mocked(api.linkGuided).mockReset();
  vi.mocked(api.guidedSession).mockResolvedValue({
    session: {
      slug: "documentary",
      mediaType: "movie",
      status: "active",
      answers: {},
      picks: [],
      acted: [],
      conversationId: null,
      createdAt: "2026-08-05T00:00:00.000Z",
      updatedAt: "2026-08-05T00:00:00.000Z",
    },
    beats: [],
  });
  vi.mocked(api.linkGuided).mockResolvedValue({
    session: {
      slug: "documentary",
      mediaType: "movie",
      status: "active",
      answers: {},
      picks: [],
      acted: [],
      conversationId: 1,
      createdAt: "2026-08-05T00:00:00.000Z",
      updatedAt: "2026-08-05T00:00:00.000Z",
    },
    beats: [],
  });
});

afterEach(() => {
  cleanup();
});

describe("CompanionPanel (Task 4.3 — in-world Companion)", () => {
  it("renders a collapsed trigger with an accessible label and no open thread", () => {
    renderPanel(getGenreWorld("documentary"));
    const trigger = screen.getByRole("button", {
      name: /talk to the documentary companion/i,
    });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // collapsed by default → ChatThread not mounted until opened
    expect(screen.queryByTestId("chat-thread")).toBeNull();
  });

  it("rations gold: lacquer FAB with world-accent, not solid gold fill", () => {
    const world = getGenreWorld("horror");
    renderPanel(world);
    const trigger = screen.getByRole("button", {
      name: /talk to the horror companion/i,
    });
    expect(trigger).toHaveClass("companion-fab");
    expect(trigger.className).not.toMatch(/bg-gold-400/);
    expect(trigger.style.getPropertyValue("--world-accent")).toBe(
      world.register.accent,
    );
  });

  it("opens into a ChatThread when the trigger is clicked", () => {
    renderPanel(getGenreWorld("documentary"));
    fireEvent.click(
      screen.getByRole("button", { name: /talk to the documentary companion/i }),
    );
    const trigger = screen.getByRole("button", {
      name: /close the documentary companion/i,
    });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("chat-thread")).toBeInTheDocument();
  });

  it("reads a numeric conversation id from GENRE_DOCK_CONVERSATION_KEY (not the global dock key)", () => {
    localStorage.setItem(GENRE_DOCK_CONVERSATION_KEY, "42");
    // a value under the GLOBAL dock key must be ignored by the genre panel
    localStorage.setItem(DOCK_CONVERSATION_KEY, "999");

    renderPanel(getGenreWorld("documentary"));
    fireEvent.click(
      screen.getByRole("button", { name: /talk to the documentary companion/i }),
    );

    expect(screen.getByTestId("ct-id").textContent).toBe("42");
    // the global dock key is never read for the conversation id
    expect(screen.getByTestId("ct-id").textContent).not.toBe("999");
  });

  it("passes null conversationId (fresh companion) when no genre key is set", () => {
    renderPanel(getGenreWorld("romance"));
    fireEvent.click(
      screen.getByRole("button", { name: /talk to the romance companion/i }),
    );
    expect(screen.getByTestId("ct-id").textContent).toBe("null");
  });

  it("writes the new conversation id back to GENRE_DOCK_CONVERSATION_KEY via onConversationChange", async () => {
    renderPanel(getGenreWorld("documentary"));
    fireEvent.click(
      screen.getByRole("button", { name: /talk to the documentary companion/i }),
    );
    expect(typeof lastProps.onConversationChange).toBe("function");
    await act(async () => {
      await lastProps.onConversationChange(77);
    });
    expect(localStorage.getItem(GENRE_DOCK_CONVERSATION_KEY)).toBe("77");
    // writing the genre conversation must NOT touch the global dock key
    expect(localStorage.getItem(DOCK_CONVERSATION_KEY)).toBeNull();
  });

  it("seeds a diegetic prefill from the world slug", () => {
    renderPanel(getGenreWorld("science-fiction"));
    fireEvent.click(
      screen.getByRole("button", { name: /talk to the science-fiction companion/i }),
    );
    expect(screen.getByTestId("ct-prefill").textContent).toMatch(
      /take me deeper into the science-fiction world/i,
    );
  });

  it("offers welcome suggestions that reference the world lexicon", () => {
    const world = getGenreWorld("documentary"); // lexicon[0] = "evidence"
    renderPanel(world);
    fireEvent.click(
      screen.getByRole("button", { name: /talk to the documentary companion/i }),
    );
    expect(Array.isArray(lastProps.welcomeSuggestions)).toBe(true);
    const titles = lastProps.welcomeSuggestions.map((s: any) => s.title);
    // first suggestion references lexicon[0]
    expect(titles[0]).toMatch(new RegExp(world.register.lexicon[0]));
    // a later suggestion references the metaphor ("Reading Room")
    expect(titles.join(" ")).toMatch(new RegExp(world.metaphor));
  });

  it("renders in compact mode", () => {
    renderPanel(getGenreWorld("horror"));
    fireEvent.click(
      screen.getByRole("button", { name: /talk to the horror companion/i }),
    );
    expect(screen.getByTestId("ct-compact").textContent).toBe("true");
  });

  it("reports open state via onOpenChange (FAB deepen wire)", () => {
    const onOpenChange = vi.fn();
    render(
      <CompanionPanel
        world={getGenreWorld("documentary")}
        guided
        onOpenChange={onOpenChange}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /deepen with the documentary companion/i,
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(true);
    fireEvent.click(
      screen.getByRole("button", {
        name: /close the documentary companion/i,
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("CompanionPanel guided per-world conversation keys", () => {
  it("genreCompanionConversationKey partitions guided, shares self", () => {
    expect(genreCompanionConversationKey("documentary", "movie", false)).toBe(
      GENRE_DOCK_CONVERSATION_KEY,
    );
    expect(genreCompanionConversationKey("horror", "movie", false)).toBe(
      GENRE_DOCK_CONVERSATION_KEY,
    );
    expect(genreCompanionConversationKey("documentary", "movie", true)).toBe(
      `${GENRE_DOCK_CONVERSATION_KEY}:guided:documentary:movie`,
    );
    expect(genreCompanionConversationKey("horror", "movie", true)).toBe(
      `${GENRE_DOCK_CONVERSATION_KEY}:guided:horror:movie`,
    );
    expect(
      genreCompanionConversationKey("documentary", "movie", true),
    ).not.toBe(genreCompanionConversationKey("horror", "movie", true));
  });

  it("guided mode opens as a denser DEEPEN HUD pane", () => {
    renderPanel(getGenreWorld("documentary"), { guided: true });
    fireEvent.click(
      screen.getByRole("button", {
        name: /deepen with the documentary companion/i,
      }),
    );
    const dialog = screen.getByRole("dialog", {
      name: /documentary deepen companion/i,
    });
    expect(dialog).toHaveAttribute("data-companion-mode", "guided-deepen");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.className).toMatch(/companion-deepen-rail/);
    expect(screen.getByText("Deepen")).toBeInTheDocument();
    expect(screen.getByText(/shelf-bound/i)).toBeInTheDocument();
    // Self chrome must not appear in guided HUD
    expect(screen.queryByText(/in-world/i)).toBeNull();
  });

  it("guided mode surfaces tour dial chips in the HUD strip", async () => {
    vi.mocked(api.guidedSession).mockResolvedValue({
      session: {
        slug: "horror",
        mediaType: "movie",
        status: "active",
        answers: { tempo: "creeping", era: "modern" },
        picks: [],
        acted: [],
        conversationId: null,
        createdAt: "2026-08-05T00:00:00.000Z",
        updatedAt: "2026-08-05T00:00:00.000Z",
      },
      beats: [
        {
          id: "tempo",
          prompt: "Tempo?",
          choices: [
            { id: "creeping", label: "Creeping", hint: "slow" },
            { id: "breach", label: "Breach", hint: "fast" },
          ],
        },
        {
          id: "era",
          prompt: "Era?",
          choices: [
            { id: "classic", label: "Classic", hint: "old" },
            { id: "modern", label: "Modern", hint: "new" },
          ],
        },
      ],
    });

    renderPanel(getGenreWorld("horror"), { guided: true });
    fireEvent.click(
      screen.getByRole("button", { name: /deepen with the horror companion/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("companion-tour-context")).toBeInTheDocument();
    });
    expect(screen.getByText("Creeping")).toBeInTheDocument();
    expect(screen.getByText("Modern")).toBeInTheDocument();
  });

  it("guided mode reads/writes the per-world key, not the shared self key", async () => {
    const guidedDocKey = genreCompanionConversationKey("documentary", "movie", true);
    localStorage.setItem(guidedDocKey, "11");
    localStorage.setItem(GENRE_DOCK_CONVERSATION_KEY, "99");

    renderPanel(getGenreWorld("documentary"), { guided: true });
    fireEvent.click(
      screen.getByRole("button", {
        name: /deepen with the documentary companion/i,
      }),
    );

    expect(screen.getByTestId("ct-id").textContent).toBe("11");

    await act(async () => {
      await lastProps.onConversationChange(55);
    });
    expect(localStorage.getItem(guidedDocKey)).toBe("55");
    // shared self key untouched
    expect(localStorage.getItem(GENRE_DOCK_CONVERSATION_KEY)).toBe("99");
    expect(api.linkGuided).toHaveBeenCalledWith({
      slug: "documentary",
      mediaType: "movie",
      conversationId: 55,
    });
  });

  it("documentary and horror guided companions keep separate conversation ids", () => {
    localStorage.setItem(
      genreCompanionConversationKey("documentary", "movie", true),
      "101",
    );
    localStorage.setItem(
      genreCompanionConversationKey("horror", "movie", true),
      "202",
    );

    const { unmount } = renderPanel(getGenreWorld("documentary"), {
      guided: true,
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /deepen with the documentary companion/i,
      }),
    );
    expect(screen.getByTestId("ct-id").textContent).toBe("101");
    unmount();

    renderPanel(getGenreWorld("horror"), { guided: true });
    fireEvent.click(
      screen.getByRole("button", { name: /deepen with the horror companion/i }),
    );
    expect(screen.getByTestId("ct-id").textContent).toBe("202");
  });

  it("hydrates conversationId from guided session blob when LS key is empty", async () => {
    vi.mocked(api.guidedSession).mockResolvedValue({
      session: {
        slug: "horror",
        mediaType: "movie",
        status: "active",
        answers: {},
        picks: [],
        acted: [],
        conversationId: 333,
        createdAt: "2026-08-05T00:00:00.000Z",
        updatedAt: "2026-08-05T00:00:00.000Z",
      },
      beats: [],
    });

    renderPanel(getGenreWorld("horror"), { guided: true });
    fireEvent.click(
      screen.getByRole("button", { name: /deepen with the horror companion/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("ct-id").textContent).toBe("333");
    });
    expect(
      localStorage.getItem(
        genreCompanionConversationKey("horror", "movie", true),
      ),
    ).toBe("333");
  });
});
