import type { GenreWorld } from "../../lib/genreWorld.js";

interface Props {
  world: GenreWorld;
  count: number;
  threshold: number;
  /** C10: when provided, renders a CTA that nudges the user to seed an
   *  anchor from their library, closing the cold-start loop. */
  onBootstrap?: () => void;
}

type Metaphor = GenreWorld["metaphor"];

/**
 * Per-metaphor empty-state copy (Task 7.2 / C6). Each metaphor gets a tailored
 * "cold start" line that speaks in its own grammar — a constellation to chart,
 * a frontier to mark, a panel to fill — instead of one generic sentence for
 * every niche genre. The page root sets `var(--world-accent)`, which we use for
 * a subtle accent on the divider, the count line, and the bootstrap CTA.
 */
const METAPHOR_COPY: Record<Metaphor, { title: string; body: string }> = {
  Constellation: {
    title: "A constellation waiting to be charted",
    body: "add a title to light the first star.",
  },
  Frontier: {
    title: "An uncharted frontier",
    body: "drop a title to mark the first trail.",
  },
  "Reading Room": {
    title: "An empty reading room",
    body: "shelve a title to begin.",
  },
  "Warm Interior": {
    title: "A quiet room",
    body: "add a title to warm it.",
  },
  Threshold: {
    title: "A threshold not yet crossed",
    body: "add a title to step through.",
  },
  Panel: {
    title: "A blank panel",
    body: "add a title to start the show.",
  },
  Generic: {
    title: "A thin world",
    body: "Anchor this world with something you love and it fills in.",
  },
};

/** Generic fallback copy, used for the Generic metaphor and for any unknown
 *  metaphor value that might slip through at runtime. */
const FALLBACK = { title: METAPHOR_COPY.Generic.title };

/**
 * Niche-genre empty state (design R6 / metric 9). Shown when a genre has
 * fewer than `threshold` titles — a tailored empty, not a blank rail.
 */
export function GenreEmptyState({ world, count, threshold, onBootstrap }: Props) {
  // A metaphor gets its own tailored copy only if it is a known, non-Generic
  // entry. Generic (and any unknown value) falls back to the count-aware line.
  const hasOwnCopy = world.metaphor !== "Generic" && world.metaphor in METAPHOR_COPY;
  const copy = hasOwnCopy
    ? METAPHOR_COPY[world.metaphor]
    : {
        title: FALLBACK.title,
        body: `Only ${count} title${count === 1 ? "" : "s"} lined up. Anchor this world with something you love and it fills in.`,
      };

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      {/* Subtle world-accent rule — the page root supplies --world-accent. */}
      <div
        aria-hidden="true"
        className="mx-auto mb-5 h-px w-16 bg-[var(--world-accent)]/40"
      />
      <h2 className="text-lg font-medium text-white/90">{copy.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/50">{copy.body}</p>
      <p className="mt-4 text-xs uppercase tracking-wide text-[var(--world-accent)]/70">
        {count} / {threshold} titles
      </p>
      {onBootstrap && (
        <button
          type="button"
          onClick={onBootstrap}
          className="mt-6 rounded-full bg-[var(--world-accent)]/90 px-5 py-2.5 text-sm font-medium text-ink-950 transition-opacity hover:opacity-90"
        >
          Anchor this world
        </button>
      )}
    </section>
  );
}
