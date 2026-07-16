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
  /** Total title count — rendered as the ghost-numerial watermark (Instrument Ink). */
  titleCount?: number;
}

export function ExperienceHero({ slug, world, anchorsUsed, profileState, titleCount }: Props) {
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);

  // World-origin line (C3): a subtle, deterministic summary of how this world
  // was seeded. Capped at the first 3 anchor titles so it stays a whisper.
  const anchorTitles = (anchorsUsed ?? []).slice(0, 3).map((a) => a.title);
  const originLine =
    anchorTitles.length > 0 ? `Seeded by ${anchorTitles.join(", ")}` : null;

  return (
    <header
      style={{ ["--world-accent" as any]: accentVar(world) }}
      className="reg-ticks relative overflow-hidden rounded-3xl border border-white/[0.06] bg-ink-850/60 p-6 sm:p-10"
    >
      {/* Ghost numeral — Instrument Ink watermark (certificate-paper readout).
          Sits behind the text (z-0); text content is z-10. */}
      {titleCount != null && (
        <span aria-hidden className="ghost-numeral" style={{ fontSize: "22rem", justifyContent: "flex-end", paddingRight: "2rem" }}>
          {titleCount}
        </span>
      )}
      <div className="relative z-10">
        {/* metaphor carried as a mono provenance readout (the "trusted" register),
            NOT a decorative accent kicker. Whispers in the margin. */}
        <p className="readout">{world.metaphor}</p>
        <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-tight text-mist-100 sm:text-6xl">
          {name}
        </h1>
        <p className="mt-3 max-w-xl font-[var(--font-sans)] text-base text-mist-300">{world.register.tonePrompt}</p>
        {originLine && (
          <p data-testid="origin-line" className="readout mt-4 opacity-70">
            {originLine}
          </p>
        )}
      </div>
    </header>
  );
}
