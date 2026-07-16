import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MarathonBuilder } from "./MarathonBuilder.js";

const KEY = (slug: string) => `lumina:marathon:${slug}`;

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("MarathonBuilder (Task 6.6 / C7)", () => {
  it("builds a playlist from watchorder + watchlist and saves it to localStorage", () => {
    render(
      <MarathonBuilder
        slug="documentary"
        seasons={[{ number: 1, name: "Season 1", episodeCount: 6, watched: false }]}
        watchlist={[
          { title: "Film A", year: 2010 },
          { title: "Film B", year: 2015 },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /build marathon/i }));

    const raw = localStorage.getItem(KEY("documentary"));
    expect(raw).toBeTruthy();
    const saved = JSON.parse(raw as string);
    expect(saved.slug).toBe("documentary");
    expect(saved.entries).toHaveLength(3);
    const titles = saved.entries.map((e: { title: string }) => e.title);
    expect(titles).toContain("Season 1");
    expect(titles).toContain("Film A");
    expect(titles).toContain("Film B");

    // the saved playlist is surfaced on the page
    expect(screen.getByTestId("marathon-playlist")).toBeTruthy();
  });

  it("exposes a printable view of the saved marathon", () => {
    render(
      <MarathonBuilder
        slug="scifi"
        watchlist={[{ title: "Solo Film" }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /build marathon/i }));
    fireEvent.click(screen.getByRole("button", { name: /printable/i }));
    expect(screen.getByTestId("marathon-printable")).toBeTruthy();
  });

  it("N7: excludes already-watched seasons from the marathon but keeps all when every season is watched", () => {
    render(
      <MarathonBuilder
        slug="scifi"
        seasons={[
          { number: 1, name: "Watched S1", episodeCount: 6, watched: true },
          { number: 2, name: "Unwatched S2", episodeCount: 4, watched: false },
        ]}
        watchlist={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /build marathon/i }));
    const saved = JSON.parse(localStorage.getItem(KEY("scifi")) as string);
    const titles = saved.entries.map((e: { title: string }) => e.title);
    expect(titles).toContain("Unwatched S2");
    expect(titles).not.toContain("Watched S1");

    // When every season is watched, the marathon is NOT emptied.
    cleanup();
    localStorage.clear();
    render(
      <MarathonBuilder
        slug="scifi"
        seasons={[{ number: 1, name: "Watched S1", episodeCount: 6, watched: true }]}
        watchlist={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /build marathon/i }));
    const savedAll = JSON.parse(localStorage.getItem(KEY("scifi")) as string);
    expect(savedAll.entries.map((e: { title: string }) => e.title)).toContain("Watched S1");
  });
});
