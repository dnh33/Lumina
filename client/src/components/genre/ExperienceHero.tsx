import { poster } from "../../lib/img.js";
import type { GenreWorld } from "../../lib/genreWorld.js";
import type { CatalogItem, GenreAnchor, ProfileState } from "../../lib/types.js";
import { accentVar } from "../../lib/metaphor.js";
import { useNeedleCount } from "../../hooks/useNeedleCount.js";
import { HeroAtmosphere } from "./HeroAtmosphere.js";

interface Props {
  slug: string;
  world: GenreWorld;
  /** Anchors that seeded this world (Task 3.2 / C3). */
  anchorsUsed?: GenreAnchor[];
  /** Taste profile density used to flavor the origin line. */
  profileState?: ProfileState;
  /** Total title count — right-side Cabinet numeral (never a watermark costume). */
  titleCount?: number;
  /** Shelf heat for the billboard — posters beside the display count. */
  heatItems?: CatalogItem[];
  /**
   * Thin session chrome (≤ ~3.5–4.5rem): metaphor + name + right numeral + atmosphere.
   * In-world default. Billboard (false) kept for tests / rare full stamp.
   */
  compact?: boolean;
  /**
   * Guided: world name is eyebrow meta — Tour owns the sole display H1.
   * Self chrome: quiet display label (not billboard).
   */
  titleAs?: "display" | "eyebrow";
  /** Inside claim-stage lacquer — no second border/ring. */
  embedded?: boolean;
}

export function ExperienceHero({
  slug,
  world,
  anchorsUsed,
  titleCount,
  heatItems,
  compact = false,
  titleAs = "display",
  embedded = false,
}: Props) {
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  const liveCount = useNeedleCount(titleCount);
  const asEyebrow = titleAs === "eyebrow";

  // World-origin line (C3): a subtle, deterministic summary of how this world
  // was seeded. Capped at the first 3 anchor titles so it stays a whisper.
  const anchorTitles = (anchorsUsed ?? []).slice(0, 3).map((a) => a.title);
  const originLine =
    anchorTitles.length > 0 ? `Seeded by ${anchorTitles.join(", ")}` : null;

  // Up to 3 posters with art — billboard only (chrome stays ≤4.5rem).
  const heat = (heatItems ?? [])
    .filter((it) => Boolean(it.posterPath))
    .slice(0, 3);

  const shellClass = embedded
    ? "relative overflow-hidden px-3 py-2 sm:px-4 sm:py-2.5"
    : compact
      ? "reg-ticks relative overflow-hidden rounded-xl border border-white/[0.06] bg-ink-850/60 px-3 py-2 sm:px-4 sm:py-2.5"
      : "reg-ticks relative overflow-hidden rounded-3xl border border-white/[0.06] bg-ink-850/60 p-5 sm:p-6";

  // Craft brief: Self ~0.11 · Guided/embedded ~0.08 (not live-busy 0.14).
  const constellationClass = asEyebrow || embedded
    ? "pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.08]"
    : "pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.11]";

  /** Compact right-plane Cabinet — Self instrument face vs Guided quieter meta. */
  const compactNumeralClass = asEyebrow
    ? "text-[2rem] sm:text-[2.25rem] text-mist-100/[0.22]"
    : "text-[2.5rem] sm:text-[2.75rem] text-mist-100/25";

  const numeral = liveCount != null && (
    <p
      data-testid="hero-display-count"
      aria-hidden
      className={`shrink-0 select-none pr-2 font-display font-semibold tabular-nums leading-none tracking-tighter sm:pr-3 ${
        compact
          ? compactNumeralClass
          : "text-6xl text-mist-100/35 sm:text-7xl"
      }`}
    >
      {liveCount}
    </p>
  );

  return (
    <header
      style={{ ["--world-accent" as any]: accentVar(world) }}
      data-hero-compact={compact ? "1" : "0"}
      data-hero-title={asEyebrow ? "eyebrow" : "display"}
      data-hero-embedded={embedded ? "1" : "0"}
      className={shellClass}
    >
      {/* Cinematic signature: grain + dust motes. Never ghost-numeral watermark. */}
      <HeroAtmosphere
        constellationAccent={accentVar(world)}
        constellationClassName={constellationClass}
      />

      {compact ? (
        /* Thin chrome: Self aligns numeral to name line; Guided to eyebrow cluster. */
        <div className="relative z-10">
          {asEyebrow ? (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs tracking-tight text-mist-300">{world.metaphor}</p>
                <p
                  data-testid="hero-world-name"
                  className="mt-0.5 truncate text-sm font-medium tracking-tight text-mist-200"
                >
                  {name}
                </p>
                {originLine && (
                  <p
                    data-testid="origin-line"
                    aria-hidden="true"
                    className="mt-0.5 truncate text-2xs tracking-tight text-mist-500"
                  >
                    {originLine}
                  </p>
                )}
              </div>
              {numeral}
            </div>
          ) : (
            <>
              <p className="text-xs tracking-tight text-mist-300">{world.metaphor}</p>
              <div className="mt-0.5 flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h1
                    data-testid="hero-world-name"
                    className="font-display text-lg font-semibold tracking-tight text-mist-100 sm:text-xl"
                  >
                    {name}
                  </h1>
                  {originLine && (
                    <p
                      data-testid="origin-line"
                      aria-hidden="true"
                      className="mt-0.5 truncate text-2xs tracking-tight text-mist-500"
                    >
                      {originLine}
                    </p>
                  )}
                </div>
                {/* Optical center on name line (not full stack) — transform, not layout thrash. */}
                <span className="-translate-y-2.5">{numeral}</span>
              </div>
            </>
          )}
          {liveCount != null && (
            <span className="sr-only">{liveCount} titles</span>
          )}
        </div>
      ) : (
        <div className="relative z-10 flex items-end gap-5 sm:gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-xs tracking-tight text-mist-300">{world.metaphor}</p>
            <h1
              data-testid="hero-world-name"
              className="mt-1 font-display text-4xl font-semibold tracking-tight text-mist-100 sm:text-5xl"
            >
              {name}
            </h1>
            <p className="mt-2 max-w-xl font-sans text-base text-mist-300">
              {world.register.tonePrompt}
            </p>
            {originLine && (
              <p
                data-testid="origin-line"
                aria-hidden="true"
                className="mt-1 text-xs tracking-tight text-mist-500"
              >
                {originLine}
              </p>
            )}
            {liveCount != null && (
              <span className="sr-only">{liveCount} titles</span>
            )}
          </div>

          {heat.length > 0 && (
            <ul
              aria-hidden
              data-testid="hero-heat"
              className="hidden shrink-0 list-none sm:flex sm:items-end"
            >
              {heat.map((it, i) => {
                const src = poster(it.posterPath, "w185");
                if (!src) return null;
                return (
                  <li
                    key={`${it.mediaType}-${it.tmdbId}`}
                    className="relative overflow-hidden rounded-lg ring-1 ring-white/10 shadow-[0_12px_28px_-14px_rgba(0,0,0,0.85)]"
                    style={{
                      width: i === 0 ? "4.25rem" : "3.6rem",
                      marginLeft: i === 0 ? 0 : "-0.85rem",
                      zIndex: heat.length - i,
                      transform:
                        i === 1
                          ? "translateY(0.35rem)"
                          : i === 2
                            ? "translateY(0.15rem)"
                            : undefined,
                    }}
                  >
                    <img
                      src={src}
                      alt=""
                      className="aspect-[2/3] w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </li>
                );
              })}
            </ul>
          )}

          {numeral}
        </div>
      )}
    </header>
  );
}
