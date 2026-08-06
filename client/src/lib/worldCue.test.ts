import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GenreWorld } from "./genreWorld.js";

// Isolate the helper from cuelume's Web Audio engine.
vi.mock("./sound.js", () => ({
  playCue: vi.fn(),
}));

import { playWorldCue } from "./worldCue.js";
import { playCue } from "./sound.js";

function worldWith(cueBeatMap: string[]): GenreWorld {
  return {
    slug: "science-fiction",
    metaphor: "Constellation",
    register: { lexicon: [], tonePrompt: "", cueBeatMap },
    modules: [],
  };
}

describe("playWorldCue", () => {
  beforeEach(() => vi.clearAllMocks());

  it("plays the first cueBeatMap entry on 'open'", () => {
    playWorldCue(worldWith(["open", "discover"]), "open");
    expect(playCue).toHaveBeenCalledWith("open");
  });

  it("plays the discover cue when present", () => {
    playWorldCue(worldWith(["open", "discover"]), "discover");
    expect(playCue).toHaveBeenCalledWith("discover");
  });

  it("falls back to the first cue when the requested one is absent", () => {
    // horror-style map has no 'discover' — should fall back to 'open'.
    playWorldCue(worldWith(["open", "warn"]), "discover");
    expect(playCue).toHaveBeenCalledWith("open");
  });

  it("does nothing when the world is undefined", () => {
    playWorldCue(undefined, "open");
    expect(playCue).not.toHaveBeenCalled();
  });

  it("does nothing when cueBeatMap is missing", () => {
    playWorldCue(
      { slug: "x", metaphor: "Generic", register: {} as any, modules: [] },
      "open",
    );
    expect(playCue).not.toHaveBeenCalled();
  });
});
