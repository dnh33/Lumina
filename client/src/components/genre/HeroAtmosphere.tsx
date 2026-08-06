import { ConstellationBackdrop } from "./ConstellationBackdrop.js";

/**
 * Compact chrome motes — 6 seeded, mid/right bias around the numeral plane.
 * Tall-stamp density (10) reads busy in a ≤4.5rem strip.
 */
export const HERO_DUST_MOTES = [
  { left: "42%", top: "28%", size: 2, delay: "0s" },
  { left: "58%", top: "62%", size: 1.5, delay: "2s" },
  { left: "72%", top: "22%", size: 2, delay: "4s" },
  { left: "84%", top: "48%", size: 1.5, delay: "1s" },
  { left: "68%", top: "78%", size: 2, delay: "5s" },
  { left: "92%", top: "36%", size: 1.5, delay: "3s" },
] as const;

interface Props {
  /** When set, draws the faint gold constellation web behind grain + dust. */
  constellationAccent?: string;
  /** Grain opacity multiplier via class (hub chrome is denser). */
  grainClassName?: string;
  /**
   * Compact dosage class — Self ~0.11 · Guided/embedded ~0.08.
   * Tall billboard / hub can omit (defaults quieter than old 0.14).
   */
  constellationClassName?: string;
}

/**
 * Cinematic header atmosphere — film grain + dust motes (+ optional
 * constellation). Always behind content (z-0); never opacity-gates copy.
 * Reduced-motion freezes drift (theme.css).
 */
export function HeroAtmosphere({
  constellationAccent,
  grainClassName = "film-grain",
  constellationClassName = "pointer-events-none absolute inset-0 z-0 h-full w-full opacity-[0.11]",
}: Props) {
  return (
    <>
      {constellationAccent ? (
        <ConstellationBackdrop
          accent={constellationAccent}
          className={constellationClassName}
        />
      ) : null}
      <div aria-hidden className={grainClassName} />
      {HERO_DUST_MOTES.map((m, i) => (
        <span
          key={i}
          aria-hidden
          className="dust-mote"
          data-testid="hero-dust-mote"
          style={{
            left: m.left,
            top: m.top,
            width: `${m.size}px`,
            height: `${m.size}px`,
            animationDelay: m.delay,
          }}
        />
      ))}
    </>
  );
}
