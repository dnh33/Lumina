export interface GenreRegister {
  lexicon: string[];
  tonePrompt: string;
  cueBeatMap: string[]; // keys into lib/sound.ts cues
  /** CSS color token (hex) used to tint metaphor UI accents per world. */
  accent: string;
  /** Tasteful mood words a viewer might be in the mood for; map to slugs via MOOD_TO_SLUGS. */
  moods: string[];
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
    register: { lexicon: ["evidence", "argument", "source"], tonePrompt: "Curious, credible, analytical.", cueBeatMap: ["open"], accent: "#64748b", moods: ["curious", "grounded", "credible"] },
    modules: ["timeline", "maker", "critic", "topic", "argument", "watchorder"],
  },
  "science-fiction": {
    slug: "science-fiction",
    metaphor: "Constellation",
    register: { lexicon: ["wonder", "frontier", "scale"], tonePrompt: "Precise, awed, expansive.", cueBeatMap: ["open", "discover"], accent: "#6366f1", moods: ["contemplative", "vast", "hopeful"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  // alias so /genre/sci-fi (server-resolved) + any legacy link still resolves
  "sci-fi": {
    slug: "sci-fi",
    metaphor: "Constellation",
    register: { lexicon: ["wonder", "frontier", "scale"], tonePrompt: "Precise, awed, expansive.", cueBeatMap: ["open", "discover"], accent: "#6366f1", moods: ["contemplative", "vast", "hopeful"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  horror: {
    slug: "horror",
    metaphor: "Threshold",
    register: { lexicon: ["dread", "confront", "release"], tonePrompt: "Uneasy, then visceral.", cueBeatMap: ["open", "warn"], accent: "#ef4444", moods: ["uneasy", "tense", "dread"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  romance: {
    slug: "romance",
    metaphor: "Warm Interior",
    register: { lexicon: ["anticipation", "intimacy", "warmth"], tonePrompt: "Tender, attentive, warm.", cueBeatMap: ["open"], accent: "#f59e0b", moods: ["tender", "warm", "hopeful"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  western: {
    slug: "western",
    metaphor: "Frontier",
    register: { lexicon: ["restlessness", "expanse", "trial"], tonePrompt: "Spare, weather-beaten, resolute.", cueBeatMap: ["open"], accent: "#14b8a6", moods: ["restless", "weathered", "resolute"] },
    modules: ["timeline", "maker", "topic", "geo"],
  },
  anime: {
    slug: "anime",
    metaphor: "Panel",
    register: { lexicon: ["discovery", "kinetic", "lore"], tonePrompt: "Vivid, kinetic, lore-rich.", cueBeatMap: ["open", "discover"], accent: "#10b981", moods: ["vivid", "kinetic", "earnest"] },
    modules: ["timeline", "maker", "topic"],
  },
  "film-noir": {
    slug: "film-noir",
    metaphor: "Threshold",
    register: { lexicon: ["shadows", "motive", "fatalism"], tonePrompt: "Cynical, precise, low-key.", cueBeatMap: ["open", "warn"], accent: "#8b5cf6", moods: ["cynical", "melancholy"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  thriller: {
    slug: "thriller",
    metaphor: "Threshold",
    register: { lexicon: ["tension", "stakes", "release"], tonePrompt: "Taut, escalating, precise.", cueBeatMap: ["open", "warn"], accent: "#e11d48", moods: ["tense", "gripping", "uneasy"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  fantasy: {
    slug: "fantasy",
    metaphor: "Constellation",
    register: { lexicon: ["wonder", "lore", "scale"], tonePrompt: "Evocative, expansive, mythic.", cueBeatMap: ["open", "discover"], accent: "#7c3aed", moods: ["wondrous", "epic", "hopeful"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  crime: {
    slug: "crime",
    metaphor: "Panel",
    register: { lexicon: ["case", "motive", "thread"], tonePrompt: "Methodical, sharp, observant.", cueBeatMap: ["open"], accent: "#fb7185", moods: ["sharp", "methodical"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  mystery: {
    slug: "mystery",
    metaphor: "Panel",
    register: { lexicon: ["clue", "doubt", "reveal"], tonePrompt: "Curious, patient, exacting.", cueBeatMap: ["open"], accent: "#c084fc", moods: ["curious", "patient"] },
    modules: ["timeline", "maker", "topic", "argument"],
  },
  comedy: {
    slug: "comedy",
    metaphor: "Warm Interior",
    register: { lexicon: ["timing", "relief", "wit"], tonePrompt: "Light, bright, quick.", cueBeatMap: ["open"], accent: "#fb923c", moods: ["playful", "bright", "lighthearted"] },
    modules: ["timeline", "maker", "topic", "watchorder"],
  },
  music: {
    slug: "music",
    metaphor: "Panel",
    register: { lexicon: ["rhythm", "era", "voice"], tonePrompt: "Sensory, era-aware, warm.", cueBeatMap: ["open", "discover"], accent: "#22d3ee", moods: ["sensory", "rhythmic", "euphoric"] },
    modules: ["timeline", "maker", "topic", "geo"],
  },
  "war-politics": {
    slug: "war-politics",
    metaphor: "Reading Room",
    register: { lexicon: ["evidence", "power", "source"], tonePrompt: "Grounded, accountable, analytical.", cueBeatMap: ["open"], accent: "#475569", moods: ["sober", "accountable"] },
    modules: ["timeline", "maker", "critic", "topic", "argument", "geo"],
  },
  history: {
    slug: "history",
    metaphor: "Reading Room",
    register: { lexicon: ["evidence", "context", "source"], tonePrompt: "Curious, contextual, credible.", cueBeatMap: ["open"], accent: "#0ea5e9", moods: ["curious", "contextual"] },
    modules: ["timeline", "maker", "critic", "topic", "geo"],
  },
  travel: {
    slug: "travel",
    metaphor: "Frontier",
    register: { lexicon: ["place", "expanse", "arrival"], tonePrompt: "Open, sensory, inviting.", cueBeatMap: ["open", "discover"], accent: "#2dd4bf", moods: ["open", "wanderlust"] },
    modules: ["timeline", "maker", "topic", "geo"],
  },
};

// K4: non-proof genres (any slug not in GENRE_WORLDS, e.g. 'action', 'drama')
// fell back to a husk with only ['timeline']. Now the fallback ships the
// server-supported, client-rendered modules so a non-proof genre still gets a
// real (if minimal) World: critic (CredibilityStrip) + argument + maker — all
// computed by genreExperienceService for any genre, and rendered by
// GenreModules. metaphor stays "Generic" (honest: not a bespoke metaphor).
const GENERIC: GenreWorld = {
  slug: "*",
  metaphor: "Generic",
  register: { lexicon: ["discover"], tonePrompt: "Curious, warm.", cueBeatMap: ["open"], accent: "#71717a", moods: ["curious"] },
  modules: ["timeline", "critic", "argument", "maker"],
};

/**
 * Mood → genre slug(s). Each mood may map to multiple worlds; the picker links
 * to the FIRST slug. Every mood declared in any world's `register.moods` (and
 * GENERIC) MUST appear here — genreWorld.test enforces that so the picker never
 * renders a dead mood chip.
 */
export const MOOD_TO_SLUGS: Record<string, string[]> = {
  curious: ["documentary", "mystery", "history"],
  grounded: ["documentary"],
  credible: ["documentary"],
  contemplative: ["science-fiction"],
  vast: ["science-fiction"],
  hopeful: ["science-fiction", "romance", "fantasy"],
  uneasy: ["horror", "thriller"],
  tense: ["horror", "thriller"],
  dread: ["horror"],
  tender: ["romance"],
  warm: ["romance"],
  restless: ["western"],
  weathered: ["western"],
  resolute: ["western"],
  vivid: ["anime"],
  kinetic: ["anime"],
  earnest: ["anime"],
  cynical: ["film-noir"],
  melancholy: ["film-noir"],
  gripping: ["thriller"],
  wondrous: ["fantasy"],
  epic: ["fantasy"],
  sharp: ["crime"],
  methodical: ["crime"],
  patient: ["mystery"],
  playful: ["comedy"],
  bright: ["comedy"],
  lighthearted: ["comedy"],
  sensory: ["music"],
  rhythmic: ["music"],
  euphoric: ["music"],
  sober: ["war-politics"],
  accountable: ["war-politics"],
  contextual: ["history"],
  open: ["travel"],
  wanderlust: ["travel"],
};

export function getGenreWorld(slug: string): GenreWorld {
  return GENRE_WORLDS[slug.toLowerCase()] ?? { ...GENERIC, slug };
}
