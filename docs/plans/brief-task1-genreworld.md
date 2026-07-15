# Task 1 — genreWorld config + types (server + client)

You are implementing ONE task of a larger TDD plan for the Lumina app (film/TV taste companion). Follow RED→GREEN→COMMIT. Write the failing test first, watch it fail, implement, watch it pass, then commit. Do NOT touch other tasks.

## Repo facts (verified, do not re-derive)
- Monorepo: server = Node/Express+SQLite (TypeScript), client = React+Vite (TypeScript).
- Server test runner: `npm run test --workspace server` (vitest). Test fixtures live in `server/test/helpers.ts`: `memoryDb()`, `seedEntry(db, {tmdbId, mediaType, titleDetails})`, `makeDetails(overrides)` are REAL exports — use them.
- Client test runner: `npm run test --workspace client` (vitest). Components use `@testing-library/react` + `jest-dom`.
- Real tokens in `client/src/theme.css`: `--font-display`, `--font-sans`. Genre components must consume the CSS VARS, never literal font names (the whole-app font migration is a separate workstream).

## Files
- Create: `server/src/services/genreWorld.ts`
- Create: `client/src/lib/genreWorld.ts` (same shape, imported by the future GenreExperience page)
- Test (server): `server/test/genreWorld.test.ts`

## Step 1: Write failing test `server/test/genreWorld.test.ts`
```ts
import { describe, it, expect } from "vitest";
import { getGenreWorld, GENRE_WORLDS } from "../src/services/genreWorld.js";

describe("genreWorld config", () => {
  it("returns a config for a known proof genre", () => {
    const doc = getGenreWorld("documentary");
    expect(doc).toBeDefined();
    expect(doc.register.lexicon).toContain("evidence");
    expect(doc.modules).toContain("timeline");
  });
  it("falls back to a generic world for unknown genres but always enables timeline", () => {
    const g = getGenreWorld("kung-fu");
    expect(g.modules).toContain("timeline");
    expect(g.register).toBeDefined();
  });
  it("proof genres are exactly documentary, sci-fi, horror", () => {
    expect(Object.keys(GENRE_WORLDS).sort()).toEqual(["documentary", "horror", "sci-fi"]);
  });
});
```

## Step 2: Run, confirm FAIL
`npm run test --workspace server -- genreWorld` → module not found.

## Step 3: Implement `server/src/services/genreWorld.ts`
```ts
export interface GenreRegister {
  lexicon: string[];
  tonePrompt: string;
  cueBeatMap: string[]; // keys into client lib/sound.ts cues
}
export interface GenreWorld {
  slug: string;
  metaphor: "Constellation" | "Threshold" | "Reading Room" | "Warm Interior" | "Frontier" | "Panel" | "Generic";
  register: GenreRegister;
  modules: Array<"timeline" | "maker" | "topic" | "geo" | "watchorder" | "critic">;
}
export const GENRE_WORLDS: Record<string, GenreWorld> = {
  documentary: { slug: "documentary", metaphor: "Reading Room", register: { lexicon: ["evidence", "argument", "source"], tonePrompt: "Curious, credible, analytical.", cueBeatMap: ["open"] }, modules: ["timeline", "maker", "critic"] },
  "sci-fi": { slug: "sci-fi", metaphor: "Constellation", register: { lexicon: ["wonder", "frontier", "scale"], tonePrompt: "Precise, awed, expansive.", cueBeatMap: ["open", "discover"] }, modules: ["timeline", "maker"] },
  horror: { slug: "horror", metaphor: "Threshold", register: { lexicon: ["dread", "confront", "release"], tonePrompt: "Uneasy, then visceral.", cueBeatMap: ["open", "warn"] }, modules: ["timeline"] },
};
const GENERIC: GenreWorld = { slug: "*", metaphor: "Generic", register: { lexicon: ["discover"], tonePrompt: "Curious, warm.", cueBeatMap: ["open"] }, modules: ["timeline"] };
export function getGenreWorld(slug: string): GenreWorld {
  return GENRE_WORLDS[slug.toLowerCase()] ?? { ...GENERIC, slug };
}
```
Mirror a thin `client/src/lib/genreWorld.ts` (same exported types + `getGenreWorld`), no server imports.

## Step 4: Run, confirm PASS
`npm run test --workspace server -- genreWorld`

## Step 5: Commit
`git add server/src/services/genreWorld.ts client/src/lib/genreWorld.ts server/test/genreWorld.test.ts && git commit -m "feat: genreWorld config + types"`

## Hard gates (do not violate)
- No DB table. No new network calls. No logs. This is config-only.
- Keep types in sync between server + client (they will be imported by later tasks).
- Em-dash banned in any strings you add.
- Do NOT implement the engine/route/page — those are other tasks.
