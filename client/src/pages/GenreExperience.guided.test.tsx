import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const navigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

const experience = {
  key: "movie:self:documentary",
  genres: ["documentary"],
  mode: "self",
  intro: { hook: "Step into the evidence.", tone: "hushed, forensic", basedOn: ["The Act of Killing"] },
  items: [
    { tmdbId: 1, mediaType: "movie", title: "Doc One", year: 2015, overview: "", posterPath: null, backdropPath: null, voteAverage: 8.1, genreIds: [99], popularity: 10, inLibrary: false },
  ],
  anchorsUsed: [],
  profileState: "rich",
};

vi.mock("../lib/api.js", () => ({
  api: { genreExperience: vi.fn(async () => experience) },
}));

async function renderGuided() {
  const qc = new QueryClient();
  const mod = await import("./GenreExperience.js");
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/genre/documentary"]}>
        <Routes>
          <Route path="/genre/:slug" element={<mod.default />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("GenreExperience AI-guided CTA", () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it("navigates to /chat with a prefilled narrative hook from the world", async () => {
    await renderGuided();
    await waitFor(() => expect(screen.getByText(/Explore with the Companion/i)).toBeDefined());
    fireEvent.click(screen.getByText(/Explore with the Companion/i));
    expect(navigate).toHaveBeenCalledWith(
      "/chat",
      expect.objectContaining({
        state: expect.objectContaining({ prefill: expect.stringContaining("Step into the evidence.") }),
      }),
    );
  });
});
