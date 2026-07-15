export interface GenreRegister {
  lexicon: string[];
  tonePrompt: string;
  cueBeatMap: string[]; // keys into lib/sound.ts cues
}

export interface GenreWorld {
  slug: string;
  metaphor: "Constellation" | "Threshold" | "Reading Room" | "Warm Interior" | "Frontier" | "Panel" | "Generic";
  register: GenreRegister;
  modules: Array<"timeline" | "maker" | "topic" | "geo" | "watchorder" | "critic">;
}

export const GENRE_WORLDS: Record<string, GenreWorld> = {
  documentary: {
    slug: "documentary",
    metaphor: "Reading Room",
    register: {
      lexicon: ["evidence", "argument", "source"],
      tonePrompt: "Curious, credible, analytical.",
      cueBeatMap: ["open"],
    },
    modules: ["timeline", "maker", "critic"],
  },
  "sci-fi": {
    slug: "sci-fi",
    metaphor: "Constellation",
    register: {
      lexicon: ["wonder", "frontier", "scale"],
      tonePrompt: "Precise, awed, expansive.",
      cueBeatMap: ["open", "discover"],
    },
    modules: ["timeline", "maker"],
  },
  horror: {
    slug: "horror",
    metaphor: "Threshold",
    register: {
      lexicon: ["dread", "confront", "release"],
      tonePrompt: "Uneasy, then visceral.",
      cueBeatMap: ["open", "warn"],
    },
    modules: ["timeline"],
  },
};

const GENERIC: GenreWorld = {
  slug: "*",
  metaphor: "Generic",
  register: {
    lexicon: ["discover"],
    tonePrompt: "Curious, warm.",
    cueBeatMap: ["open"],
  },
  modules: ["timeline"],
};

export function getGenreWorld(slug: string): GenreWorld {
  return GENRE_WORLDS[slug.toLowerCase()] ?? { ...GENERIC, slug };
}
