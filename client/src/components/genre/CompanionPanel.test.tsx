import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { CompanionPanel } from "./CompanionPanel";
import { getGenreWorld, type GenreWorld } from "../../lib/genreWorld";
import {
  DOCK_CONVERSATION_KEY,
  GENRE_DOCK_CONVERSATION_KEY,
} from "../../lib/keys";

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

function renderPanel(world: GenreWorld) {
  return render(<CompanionPanel world={world} />);
}

beforeEach(() => {
  localStorage.clear();
  lastProps = null;
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

  it("writes the new conversation id back to GENRE_DOCK_CONVERSATION_KEY via onConversationChange", () => {
    renderPanel(getGenreWorld("documentary"));
    fireEvent.click(
      screen.getByRole("button", { name: /talk to the documentary companion/i }),
    );
    expect(typeof lastProps.onConversationChange).toBe("function");
    act(() => {
      lastProps.onConversationChange(77);
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
});
