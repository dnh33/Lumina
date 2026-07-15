import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GenrePicker from "./GenrePicker.js";
import { GENRE_WORLDS, MOOD_TO_SLUGS } from "../lib/genreWorld.js";

vi.mock("../lib/api.js", () => ({
  api: {
    genres: vi.fn(async () => [
      { id: 99, name: "Documentary" },
      { id: 878, name: "Science Fiction" },
      { id: 27, name: "Horror" },
      { id: 18, name: "Drama" },
    ]),
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

  it("renders a chip for every mood declared by the worlds", () => {
    renderPicker();
    const allMoods = Array.from(
      new Set(Object.values(GENRE_WORLDS).flatMap((w) => w.register.moods)),
    );
    for (const mood of allMoods) {
      const link = screen.getByText(new RegExp(`^${mood}$`, "i")).closest("a");
      expect(link, `missing mood chip: ${mood}`).toBeDefined();
    }
  });

  it("links each mood chip to the first mapped genre's /genre/:slug", () => {
    renderPicker();
    for (const [mood, slugs] of Object.entries(MOOD_TO_SLUGS)) {
      const link = screen.getByText(new RegExp(`^${mood}$`, "i")).closest("a");
      expect(link, `missing mood chip: ${mood}`).toBeDefined();
      expect(link?.getAttribute("href")).toContain(`/genre/${slugs[0]}`);
    }
  });

  it("gives every mood chip an accessible label", () => {
    renderPicker();
    const region = screen.getByRole("region", { name: /browse by mood/i });
    const chips = region.querySelectorAll("a[aria-label]");
    expect(chips.length).toBeGreaterThan(0);
    for (const chip of Array.from(chips)) {
      expect((chip as HTMLElement).getAttribute("aria-label")).toMatch(/browse .* worlds/i);
    }
  });
});
