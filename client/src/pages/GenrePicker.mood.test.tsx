import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GenrePicker from "./GenrePicker.js";
import { MOOD_TO_SLUGS } from "../lib/genreWorld.js";

/** Mirrors GenrePicker HUB_MOODS — Wave 3 soup quarantine (≤8). */
const HUB_MOODS = [
  "dread",
  "uneasy",
  "wondrous",
  "contemplative",
  "tender",
  "restless",
  "playful",
  "curious",
] as const;

vi.mock("../lib/api.js", () => ({
  api: {
    genres: vi.fn(async () => [
      { id: 99, name: "Documentary" },
      { id: 878, name: "Science Fiction" },
      { id: 27, name: "Horror" },
      { id: 18, name: "Drama" },
    ]),
    library: vi.fn(async () => []),
  },
}));

function renderPicker() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/genre"]}>
        <Routes>
          <Route path="/genre" element={<GenrePicker />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("GenrePicker mood entry (C2)", () => {
  it("renders a 'Browse by mood' section", () => {
    renderPicker();
    expect(
      screen.getByRole("region", { name: /browse by mood/i }),
    ).toBeDefined();
  });

  it("renders at most 8 high-signal mood doors (soup quarantine)", () => {
    renderPicker();
    const region = screen.getByRole("region", { name: /browse by mood/i });
    const links = region.querySelectorAll("a");
    expect(links.length).toBe(HUB_MOODS.length);
    expect(links.length).toBeLessThanOrEqual(8);
    for (const mood of HUB_MOODS) {
      const link = screen.getByText(new RegExp(`^${mood}$`, "i")).closest("a");
      expect(link, `missing mood door: ${mood}`).toBeDefined();
    }
  });

  it("links each hub mood to the first mapped genre's /genre/:slug", () => {
    renderPicker();
    for (const mood of HUB_MOODS) {
      const slugs = MOOD_TO_SLUGS[mood];
      expect(slugs?.length).toBeGreaterThan(0);
      const link = screen.getByText(new RegExp(`^${mood}$`, "i")).closest("a");
      expect(link, `missing mood door: ${mood}`).toBeDefined();
      expect(link?.getAttribute("href")).toContain(`/genre/${slugs[0]}`);
    }
  });

  it("gives every mood door an accessible label", () => {
    renderPicker();
    const region = screen.getByRole("region", { name: /browse by mood/i });
    const chips = region.querySelectorAll("a[aria-label]");
    expect(chips.length).toBe(HUB_MOODS.length);
    for (const chip of Array.from(chips)) {
      expect((chip as HTMLElement).getAttribute("aria-label")).toMatch(
        /enter .+ through .+/i,
      );
    }
  });
});
