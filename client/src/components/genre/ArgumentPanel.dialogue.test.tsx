import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ArgumentPanel } from "./ArgumentPanel.js";

const ANNOTATION_BASE = "lumina:arg-annotation:";

describe("ArgumentPanel dialogue (Task 6.1 / D2)", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("renders multiple comparisons with relation labels", () => {
    const comparisons = [
      { title: "For Title", relation: "for", tmdbId: 11, mediaType: "movie" },
      { title: "Against Title", relation: "against", tmdbId: 22, mediaType: "tv" },
      { title: "Neutral Title", relation: "neutral" },
    ] as any;

    render(
      <MemoryRouter>
        <ArgumentPanel
          thesis="A tight, morally grey Western."
          comparisons={comparisons}
          tmdbId={99}
        />
      </MemoryRouter>,
    );

    // Thesis present.
    expect(screen.getByText("A tight, morally grey Western.")).toBeTruthy();
    // Relation labels render.
    expect(screen.getByText("For")).toBeTruthy();
    expect(screen.getByText("Against")).toBeTruthy();
    expect(screen.getByText("Neutral")).toBeTruthy();
    // Linked titles render as links when tmdbId is present.
    const forLink = screen.getByRole("link", { name: /For Title/i });
    expect(forLink).toHaveAttribute("href", "/title/movie/11");
    const againstLink = screen.getByRole("link", { name: /Against Title/i });
    expect(againstLink).toHaveAttribute("href", "/title/tv/22");
    // Unlinked title still present as text.
    expect(screen.getByText("Neutral Title")).toBeTruthy();
  });

  it("renders a user annotation input", () => {
    render(
      <MemoryRouter>
        <ArgumentPanel thesis="Thesis here." tmdbId={7} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Add a note about this title/i);
    expect(input).toBeTruthy();
    expect((input as HTMLTextAreaElement).tagName).toBe("TEXTAREA");
  });

  it("persists typing to localStorage under the tmdbId key and reloads on remount", () => {
    const key = `${ANNOTATION_BASE}7`;
    const { unmount } = render(
      <MemoryRouter>
        <ArgumentPanel thesis="Thesis here." tmdbId={7} />
      </MemoryRouter>,
    );

    const input = screen.getByPlaceholderText(/Add a note about this title/i) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "My hot take" } });
    expect(localStorage.getItem(key)).toBe("My hot take");

    // Remount: the persisted note is read back from localStorage.
    unmount();
    render(
      <MemoryRouter>
        <ArgumentPanel thesis="Thesis here." tmdbId={7} />
      </MemoryRouter>,
    );
    const restored = screen.getByPlaceholderText(/Add a note about this title/i) as HTMLTextAreaElement;
    expect(restored.value).toBe("My hot take");
  });

  it("does not render a note input when no tmdbId is provided", () => {
    render(
      <MemoryRouter>
        <ArgumentPanel thesis="Thesis only." />
      </MemoryRouter>,
    );
    expect(screen.queryByPlaceholderText(/Add a note about this title/i)).toBeNull();
  });

  it("is graceful when only the thesis is present (no comparisons)", () => {
    const { container } = render(
      <MemoryRouter>
        <ArgumentPanel thesis="Thesis only, no counterpoint." tmdbId={42} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Thesis only, no counterpoint.")).toBeTruthy();
    // No comparison list rows rendered.
    expect(container.querySelectorAll("ul li")).toHaveLength(0);
  });
});
