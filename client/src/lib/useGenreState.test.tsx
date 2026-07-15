import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { useGenreState, GENRE_STATE_KEY } from "./useGenreState.js";

/** Tiny harness that uses the hook and exposes its live state + the URL
 *  search string so the tests can assert URL-addressability and persistence. */
function Harness({ slug }: { slug: string }) {
  const gs = useGenreState(slug);
  const [sp] = useSearchParams();
  return (
    <div>
      <span data-testid="decade">{gs.decade ?? ""}</span>
      <span data-testid="search">{gs.search}</span>
      <span data-testid="sort">{gs.sort}</span>
      <span data-testid="tags">{gs.activeTags.join(",")}</span>
      <span data-testid="steer">
        {gs.steer.mode}:{gs.steer.mediaType}
      </span>
      <span data-testid="url">{sp.toString()}</span>
      <button data-testid="set-decade" onClick={() => gs.setDecade(2010)}>
        set-decade
      </button>
      <button
        data-testid="set-search"
        onClick={() => gs.setSearch("foo")}
      >
        set-search
      </button>
      <button
        data-testid="set-sort"
        onClick={() => gs.setSort("year")}
      >
        set-sort
      </button>
      <button
        data-testid="set-tags"
        onClick={() => gs.setActiveTags(["Sci-Fi", "Noir"])}
      >
        set-tags
      </button>
      <button
        data-testid="set-steer"
        onClick={() => gs.setSteer({ mode: "guided", mediaType: "tv" })}
      >
        set-steer
      </button>
      <button data-testid="dismiss" onClick={() => gs.dismiss(42)}>
        dismiss
      </button>
    </div>
  );
}

function renderAt(slug: string, initialPath = `/genre/${slug}`) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/genre/:slug" element={<Harness slug={slug} />} />
      </Routes>
    </MemoryRouter>,
  );
}

const KEY = (slug: string) => `${GENRE_STATE_KEY}:${slug}`;

function persisted(slug: string) {
  const raw = localStorage.getItem(KEY(slug));
  return raw ? JSON.parse(raw) : null;
}

describe("useGenreState (Task 4.4 — world persistence)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("(a) setting decade writes ?decade=2010s to the URL (replace)", () => {
    renderAt("documentary");
    expect(screen.getByTestId("url").textContent).not.toContain("decade");

    fireEvent.click(screen.getByTestId("set-decade"));

    expect(screen.getByTestId("url").textContent).toContain("decade=2010s");
    expect(screen.getByTestId("decade").textContent).toBe("2010");
  });

  it("(b) mounting with ?decade=2000s&q=foo initializes filter state", () => {
    renderAt("documentary", "/genre/documentary?decade=2000s&q=foo");

    expect(screen.getByTestId("decade").textContent).toBe("2000");
    expect(screen.getByTestId("search").textContent).toBe("foo");
  });

  it("(c) dismiss(id) persists the dismissed tmdbId to localStorage", () => {
    renderAt("documentary");

    fireEvent.click(screen.getByTestId("dismiss"));

    const blob = persisted("documentary");
    expect(blob).not.toBeNull();
    expect(blob.dismissed).toContain("42");
  });

  it("(d) setSteer persists {mode,mediaType} to localStorage", () => {
    renderAt("documentary");

    fireEvent.click(screen.getByTestId("set-steer"));

    const blob = persisted("documentary");
    expect(blob).not.toBeNull();
    expect(blob.steer).toEqual({ mode: "guided", mediaType: "tv" });
    expect(screen.getByTestId("steer").textContent).toBe("guided:tv");
  });

  it("(e) filter changes persist a scrub blob to localStorage", () => {
    renderAt("documentary");

    act(() => {
      fireEvent.click(screen.getByTestId("set-search"));
      fireEvent.click(screen.getByTestId("set-sort"));
      fireEvent.click(screen.getByTestId("set-tags"));
    });

    const blob = persisted("documentary");
    expect(blob.scrub).toEqual({
      decade: null,
      search: "foo",
      sort: "year",
      tags: ["Sci-Fi", "Noir"],
    });
    // url must also carry the filter (addressable)
    expect(screen.getByTestId("url").textContent).toContain("q=foo");
    expect(screen.getByTestId("url").textContent).toContain("sort=year");
    expect(screen.getByTestId("url").textContent).toContain(
      "tags=Sci-Fi%2CNoir",
    );
  });

  it("(f) falls back to a persisted localStorage blob when URL is empty", () => {
    localStorage.setItem(
      KEY("documentary"),
      JSON.stringify({
        scrub: { decade: 1990, search: "legacy", sort: "rating", tags: [] },
        steer: { mode: "guided", mediaType: "movie" },
        dismissed: ["7"],
      }),
    );

    renderAt("documentary");

    expect(screen.getByTestId("decade").textContent).toBe("1990");
    expect(screen.getByTestId("search").textContent).toBe("legacy");
    expect(screen.getByTestId("sort").textContent).toBe("rating");
    expect(screen.getByTestId("steer").textContent).toBe("guided:movie");
  });
});
