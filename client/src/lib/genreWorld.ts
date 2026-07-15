export interface GenreRegister {
  lexicon: string[];
  tonePrompt: string;
  cueBeatMap: string[]; // keys into lib/sound.ts cues
}

export interface GenreWorld {
  slug: string;
  metaphor: "Constellation" | "Threshold" | "Reading Room" | "Warm Interior" | "Frontier" | "Panel" | "Generic";
  register: GenreRegister;
  modules: Array<"timeline" | "maker" | "topic" | "geo" | "watchorder" | "critic" | "argument">;
}

/**
 * 13-genre v1.5 matrix (docs/plans/2026-07-15-genre-v15-matrix-spec.md).
 * Module keys map to GenreModules switches. Keys are slugify(TMDB name) form
 * so GenrePicker links + server resolution line up.
 */
export const GENRE_WORLDS: Record<string, GenreWorld> = {
  documentary: {
    slug: "documentary",
    metaphor: "Reading Room",
    register: { lexicon: ["evidence", "argument", "source"], tonePrompt: "Curious, credible, analytical.", cueBeatMap: ["open"] },
    modules: ["timeline", "maker", "critic", "topic", "argument", "watchorder"],
  },
  "science-fiction": {
    slug: "science-fiction",
    metaphor: "Constellation",
    register: { lexicon: ["wonder", "frontier", "scale"], tonePrompt: "Precise, awed, expansive.", cueBeatMap: ["open", "discover"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  // alias so /genre/sci-fi (server-resolved) + any legacy link still resolves
  "sci-fi": {
    slug: "sci-fi",
    metaphor: "Constellation",
    register: { lexicon: ["wonder", "frontier", "scale"], tonePrompt: "Precise, awed, expansive.", cueBeatMap: ["open", "discover"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  horror: {
    slug: "horror",
    metaphor: "Threshold",
    register: { lexicon: ["dread", "confront", "release"], tonePrompt: "Uneasy, then visceral.", cueBeatMap: ["open", "warn"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  romance: {
    slug: "romance",
    metaphor: "Warm Interior",
    register: { lexicon: ["anticipation", "intimacy", "warmth"], tonePrompt: "Tender, attentive, warm.", cueBeatMap: ["open"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  western: {
    slug: "western",
    metaphor: "Frontier",
    register: { lexicon: ["restlessness", "expanse", "trial"], tonePrompt: "Spare, weather-beaten, resolute.", cueBeatMap: ["open"] },
    modules: ["timeline", "maker", "topic", "geo"],
  },
  anime: {
    slug: "anime",
    metaphor: "Panel",
    register: { lexicon: ["discovery", "kinetic", "lore"], tonePrompt: "Vivid, kinetic, lore-rich.", cueBeatMap: ["open", "discover"] },
    modules: ["timeline", "maker", "topic"],
  },
  "film-noir": {
    slug: "film-noir",
    metaphor: "Threshold",
    register: { lexicon: ["shadows", "motive", "fatalism"], tonePrompt: "Cynical, precise, low-key.", cueBeatMap: ["open", "warn"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  thriller: {
    slug: "thriller",
    metaphor: "Threshold",
    register: { lexicon: ["tension", "stakes", "release"], tonePrompt: "Taut, escalating, precise.", cueBeatMap: ["open", "warn"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  fantasy: {
    slug: "fantasy",
    metaphor: "Constellation",
    register: { lexicon: ["wonder", "lore", "scale"], tonePrompt: "Evocative, expansive, mythic.", cueBeatMap: ["open", "discover"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  crime: {
    slug: "crime",
    metaphor: "Panel",
    register: { lexicon: ["case", "motive", "thread"], tonePrompt: "Methodical, sharp, observant.", cueBeatMap: ["open"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  mystery: {
    slug: "mystery",
    metaphor: "Panel",
    register: { lexicon: ["clue", "doubt", "reveal"], tonePrompt: "Curious, patient, exacting.", cueBeatMap: ["open"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  comedy: {
    slug: "comedy",
    metaphor: "Warm Interior",
    register: { lexicon: ["timing", "relief", "wit"], tonePrompt: "Light, bright, quick.", cueBeatMap: ["open"] },
    modules: ["timeline", "maker", "topic", "watchorder"],
  },
  music: {
    slug: "music",
    metaphor: "Panel",
    register: { lexicon: ["rhythm", "era", "voice"], tonePrompt: "Sensory, era-aware, warm.", cueBeatMap: ["open", "discover"] },
    modules: ["timeline", "maker", "topic", "geo"],
  },
  "war-politics": {
    slug: "war-politics",
    metaphor: "Reading Room",
    register: { lexicon: ["evidence", "power", "source"], tonePrompt: "Grounded, accountable, analytical.", cueBeatMap: ["open"] },
    modules: ["timeline", "maker", "critic", "topic", "argument", "geo"],
  },
  history: {
    slug: "history",
    metaphor: "Reading Room",
    register: { lexicon: ["evidence", "context", "source"], tonePrompt: "Curious, contextual, credible.", cueBeatMap: ["open"] },
    modules: ["timeline", "maker", "critic", "topic", "geo"],
  },
  travel: {
    slug: "travel",
    metaphor: "Frontier",
    register: { lexicon: ["place", "expanse", "arrival"], tonePrompt: "Open, sensory, inviting.", cueBeatMap: ["open", "discover"] },
    modules: ["timeline", "maker", "topic", "geo"],
  },
};

const GENERIC: GenreWorld = {
  slug: "*",
  metaphor: "Generic",
  register: { lexicon: ["discover"], tonePrompt: "Curious, warm.", cueBeatMap: ["open"] },
  modules: ["timeline"],
};

export function getGenreWorld(slug: string): GenreWorld {
  return GENRE_WORLDS[slug.toLowerCase()] ?? { ...GENERIC, slug };
}
