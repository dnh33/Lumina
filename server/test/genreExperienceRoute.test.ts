import { describe, it, expect, vi, beforeEach } from "vitest";

const { buildGenreExperience } = vi.hoisted(() => ({
  buildGenreExperience: vi.fn(),
}));

vi.mock("../src/services/genreExperienceService.js", () => ({
  buildGenreExperience,
}));

vi.mock("../src/db/connection.js", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getDb: () => ({ mock: "db" }),
}));

const { catalogRouter } = await import("../src/routes/catalog.js");

type Handler = (req: unknown, res: unknown, next: () => void) => Promise<void>;

function findHandler(path: string): Handler | undefined {
  const stack = (catalogRouter as unknown as { stack: Array<{ route?: { path: string; stack: Array<{ handle: Handler }> } }> }).stack;
  return stack.find((l) => l.route?.path === path)?.route?.stack[0]?.handle;
}

function mockRes() {
  const res = {
    json: vi.fn(),
    status: vi.fn(() => res),
  };
  return res;
}

const experience = {
  key: "documentary",
  genres: ["documentary"],
  mode: "self",
  intro: { hook: "h", tone: "t", basedOn: "b" },
  items: [
    { tmdbId: 1, mediaType: "movie", title: "Doc", year: 2020, genreIds: [99], inLibrary: false },
  ],
  anchorsUsed: [],
  profileState: "thin",
};

describe("GET /discover/genre-experience", () => {
  beforeEach(() => {
    buildGenreExperience.mockReset();
    buildGenreExperience.mockResolvedValue(experience);
  });

  it("is registered on catalogRouter", () => {
    expect(findHandler("/discover/genre-experience")).toBeDefined();
  });

  it("parses comma-separated genres, defaults mode=self / mediaType=movie, returns the experience", async () => {
    const handler = findHandler("/discover/genre-experience")!;
    const res = mockRes();
    await handler({ query: { genres: "documentary" } }, res, vi.fn());
    expect(buildGenreExperience).toHaveBeenCalledWith(expect.anything(), {
      genres: ["documentary"],
      mediaType: "movie",
      mode: "self",
      modules: expect.any(Array),
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ genres: ["documentary"], items: expect.any(Array) }),
    );
  });

  it("OR-combines multiple genres and honors mode=guided + mediaType=tv", async () => {
    const handler = findHandler("/discover/genre-experience")!;
    const res = mockRes();
    await handler(
      { query: { genres: "sci-fi, horror", mode: "guided", mediaType: "tv" } },
      res,
      vi.fn(),
    );
    expect(buildGenreExperience).toHaveBeenCalledWith(expect.anything(), {
      genres: ["sci-fi", "horror"],
      mediaType: "tv",
      mode: "guided",
      modules: expect.any(Array),
    });
  });
});
