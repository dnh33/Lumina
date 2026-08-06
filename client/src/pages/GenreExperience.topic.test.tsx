import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// --- fixtures --------------------------------------------------------------

function makeItem(tmdbId: number, title: string, over: Partial<any> = {}) {
  return {
    tmdbId,
    mediaType: "movie" as const,
    title,
    year: 2000,
    overview: "",
    posterPath: null,
    backdropPath: null,
    voteAverage: 5,
    genreIds: [18],
    popularity: null,
    ...over,
  };
}

// The "documentary" world enables the `topic` module, so its items get grouped
// into topic spines by primary genre id. Two primary genres appear: 99
// (Documentary) and 18 (Drama). 7 items total.
const EXPERIENCE = {
  key: "movie:self:documentary",
  genres: ["documentary"],
  mode: "self",
  intro: null,
  items: [
    makeItem(1, "Alpha Film", { genreIds: [99, 18] }),
    makeItem(2, "Beta Doc", { genreIds: [99] }),
    makeItem(3, "Gamma Story", { genreIds: [18] }),
    makeItem(4, "Delta Tale", { genreIds: [99] }),
    makeItem(5, "Epsilon Yarn", { genreIds: [18] }),
    makeItem(6, "Zeta Reel", { genreIds: [99] }),
    makeItem(7, "Theta Cut", { genreIds: [18] }),
  ],
  anchorsUsed: [],
  profileState: {},
};

const INTRO = { hook: "Dive in.", tone: "warm", basedOn: [] };

// --- mocks -----------------------------------------------------------------

vi.mock("../lib/api.js", () => ({
  api: {
    genreExperience: vi.fn(async () => EXPERIENCE),
    genreIntro: vi.fn(async () => INTRO),
  },
}));

const navigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => navigate };
});

const TITLE_RE = /^(Alpha Film|Beta Doc|Gamma Story|Delta Tale|Epsilon Yarn|Zeta Reel|Theta Cut)$/;

async function renderPage() {
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

// --- tests -----------------------------------------------------------------

describe("GenreExperience D7 topic-as-axis filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("wires a topic spine click into the client-side genre filter", async () => {
    await renderPage();

    // Topic spines render as clickable buttons (onTopicSelect is now passed).
    const topics = await screen.findByLabelText(/Topic threads/i);

    // Capture the rail size BEFORE any filter is applied. Every steered-driven
    // section renders each of the 7 mocked items once, so this count is a
    // stable multiple of the item set.
    const beforeCount = screen.queryAllByText(TITLE_RE).length;
    expect(beforeCount).toBeGreaterThan(0);

    // Clicking the "Documentary" spine threads the topic id into the
    // client-side genre filter: the matching genre chip becomes pressed AND the
    // steered rails drop the Drama-only titles (gid 18: Gamma/Epsilon/Theta)
    // so the 4 Documentary-genre items (gid 99) remain.
    fireEvent.click(within(topics).getByRole("button", { name: "Documentary" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Documentary", pressed: true }),
      ).toBeTruthy(),
    );

    await waitFor(() => {
      const afterCount = screen.queryAllByText(TITLE_RE).length;
      // Fewer titles survive (Drama-only dropped); ratio preserved across sections.
      expect(afterCount).toBeLessThan(beforeCount);
    });

    // Clicking again toggles the tag OFF (D7 is a toggle, not a one-way set):
    // the rail restores to its full size.
    fireEvent.click(within(topics).getByRole("button", { name: "Documentary" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Documentary", pressed: false }),
      ).toBeTruthy(),
    );
    await waitFor(() => {
      const restored = screen.queryAllByText(TITLE_RE).length;
      expect(restored).toBe(beforeCount);
    });
  });
});
