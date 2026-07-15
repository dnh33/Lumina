import type { GenreWorld } from "../../lib/genreWorld.js";
import type { GenreAnchor, ProfileState } from "../../lib/types.js";
import { accentVar } from "../../lib/metaphor.js";

interface Props {
  slug: string;
  world: GenreWorld;
  /** Anchors that seeded this world (Task 3.2 / C3). */
  anchorsUsed?: GenreAnchor[];
  /** Taste profile density used to flavor the origin line. */
  profileState?: ProfileState;
}

export function ExperienceHero({ slug, world, anchorsUsed, profileState }: Props) {
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);

  // World-origin line (C3): a subtle, deterministic summary of how this world
  // was seeded. Capped at the first 3 anchor titles so it stays a whisper.
  const anchorTitles = (anchorsUsed ?? []).slice(0, 3).map((a) => a.title);
  const originLine =
    anchorTitles.length > 0 ? `Seeded by ${anchorTitles.join(", ")}` : null;

  return (
    <header
      style={{ ["--world-accent" as any]: accentVar(world) }}
      className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[var(--world-accent)]/[0.08] via-white/[0.02] to-transparent p-6 sm:p-10"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--world-accent)]/70">{world.metaphor}</p>
      <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        {name}
      </h1>
      <p className="mt-3 max-w-xl font-[var(--font-sans)] text-base text-white/60">{world.register.tonePrompt}</p>
      {originLine && (
        <p data-testid="origin-line" className="mt-4 text-xs text-white/40">
          {originLine}
        </p>
      )}
    </header>
  );
}
