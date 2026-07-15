import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GenrePicker } from "./GenrePicker.js";
import { GENRE_WORLDS } from "../lib/genreWorld.js";

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

describe("GenrePicker", () => {
  it("renders proof genres as links to /genre/:slug", () => {
    renderPicker();
    for (const slug of Object.keys(GENRE_WORLDS)) {
      const link = screen.getByText(new RegExp(slug, "i")).closest("a");
      expect(link).toBeDefined();
      expect(link?.getAttribute("href")).toContain(`/genre/${slug}`);
    }
  });

  it("renders other genres too (from api.genres)", async () => {
    renderPicker();
    expect(await screen.findByText(/Drama/i)).toBeDefined();
  });

  it("shows the world metaphor/tone as ambient microcopy for proof genres", () => {
    renderPicker();
    expect(screen.getByText(/curious, credible, analytical/i)).toBeDefined();
  });
});
