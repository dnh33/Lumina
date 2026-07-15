import type { GenreWorld } from "../../lib/genreWorld.js";

interface Props {
  world: GenreWorld;
  count: number;
  threshold: number;
}

/** Genre-specific empty-state copy (design R6: Western/Music/War&Politics). */
const COPY: Record<string, { title: string; body: string }> = {
  western: {
    title: "The frontier is quiet",
    body: "Not much has been logged out here yet. Ride in via a title you love and the world will start mapping itself.",
  },
  music: {
    title: "The stage is dark",
    body: "Few titles in this world so far. Drop a concert film or music doc you rate and the beat builds from there.",
  },
  "war-politics": {
    title: "The archive is thin",
    body: "This world is sparse right now. Anchor it with a documentary or speech you trust and the argument takes shape.",
  },
};

/**
 * Niche-genre empty state (design R6 / metric 9). Shown when a genre has
 * fewer than `threshold` titles — a tailored empty, not a blank rail.
 */
export function GenreEmptyState({ world, count, threshold }: Props) {
  const copy = COPY[world.slug] ?? {
    title: "A thin world",
    body: `Only ${count} title${count === 1 ? "" : "s"} lined up. Anchor this world with something you love and it fills in.`,
  };
  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center">
      <h2 className="text-lg font-medium text-white/90">{copy.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/50">{copy.body}</p>
      <p className="mt-4 text-xs uppercase tracking-wide text-white/30">
        {count} / {threshold} titles
      </p>
    </section>
  );
}
