/**
 * CriticsBadge — brand-faithful, surface-tuned ratings chips for the three
 * external sources. Gold stays reserved for the user's OWN rating (P5/P10);
 * these hues are the only others and are never glow-lit, so the cinematic
 * system holds.
 *
 * Iconography uses the official brand glyphs:
 *  - IMDb  → IMDb gold star mark (#F5C518)
 *  - RT     → Rotten Tomatoes tomato (fresh, red) / splat (rotten, green)
 *            — their real ≥60/&lt;60 convention
 *  - TMDB   → The Movie Database cyan wordmark (#01B4E4)
 */

type Source = "imdb" | "rt" | "tmdb";

interface Props {
  source: Source;
  /** imdb/tmdb: 0–10 · rt: 0–100 */
  score: number;
  /** compact = icon + number (poster corners) · full = icon + wordmark + number */
  variant?: "compact" | "full";
  /** extra classes — e.g. absolute positioning on poster corners */
  className?: string;
}

function format(source: Source, score: number): string {
  if (source === "rt") return `${Math.round(score)}%`;
  return score.toFixed(1); // imdb + tmdb are 0–10
}

const isFresh = (rt: number) => rt >= 60;

/* brand accent (text + ring), tuned to the dark surface */
function accent(source: Source, score: number): string {
  if (source === "imdb") return "text-[#f5c518] ring-[#f5c518]/25";
  if (source === "rt") return isFresh(score) ? "text-[#fa320a] ring-[#fa320a]/30" : "text-[#5cb85c] ring-[#5cb85c]/30";
  // TMDB is always its brand cyan — no score-based recolour
  return "text-[#01b4e4] ring-[#01b4e4]/30";
}

function wordmark(source: Source): string {
  if (source === "imdb") return "IMDb";
  if (source === "rt") return "RT";
  return "TMDB";
}

/* ── Official brand glyphs ─────────────────────────────────────── */

function ImdbMark() {
  // IMDb's rating glyph is the gold star (its text logo blobs at this size)
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M12 2.4l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.8l1.1-6.5L2.6 9.7l6.5-.9z" />
    </svg>
  );
}

function RtMark({ rotten }: { rotten: boolean }) {
  if (rotten) {
    // Rotten Tomatoes "rotten" splat glyph
    return (
      <svg viewBox="0 0 512 512" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
        <path d="m401.2 113.7l-.7-1.9C391.3 87.2 332 61 276 72.9c2.7-10.2 10.6-16.8 24.4-20.5l8.1-2.2l-5.8-6C287.3 28.1 271 21 254.1 22.8c-19.5 2.2-36.6 16.9-47.7 32L182.5 0l-43.3 25.5l24.9 32.2c-37.8-9.5-72 3.8-97.6 38.6l-6.7 9.1l11.2-1.2c14.6-1.6 28.3-2.7 43.4-.3c-17.4 5.7-33.8 16.6-47.9 25.9c-9.2 6.1-17.1 11.3-22.6 13.2l-14.2 4.9l14.4 4.5c7.2 2.2 13.9 4.2 20.2 5.8c-92.2 101.5-40.4 220-11.7 259.6c132.2 157.4 348.1 95.1 419.7-22.2c17.4-29.6 79.8-188-71.1-281.9M72.1 138c19-12.6 42.7-28.2 65.3-28.3l27.7-.1l-26-9.5c-21.4-7.8-39.6-8.3-57.3-6.9c19.3-21.6 49.9-39.3 94.3-21.2l17 6.9L154 28.3l24-14.2l26.9 61.7l4.9-8.2c9.3-15.5 26.1-32.9 45.4-35c11.6-1.3 23.2 3 34.6 12.9c-15.6 6.4-23.9 17.7-24.7 33.6l-.3 6.8l6.6-1.8c45.4-12.5 94.4 4.3 113 21.6c-16.5-1.6-34.9 3.9-54.1 9.7c-29.9 9-60.9 18.3-88.6 2.5l-7.4-4.2v8.5c0 23-8 38.8-24.6 48.3c-11.3 6.5-25.1 9-37.3 10.2c.2-.4.4-.9.6-1.3c7.4-16.1 15.8-34.4.9-52.5l-3.6-4.3l-3.8 4.1c-24.7 26.5-44.2 37.6-107.5 19.7c4-2.4 8.4-5.3 13.1-8.4" />
      </svg>
    );
  }
  // Rotten Tomatoes official tomato logo (red, fresh)
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M5.866 0L4.335 1.262l2.082 1.8c-2.629-.989-4.842 1.4-5.012 2.338 1.384-.323 2.24-.422 3.344-.335-7.042 4.634-4.978 13.148-1.434 16.094 5.784 4.612 13.77 3.202 17.91-1.316C27.26 13.363 22.993.65 10.86 2.766c.107-1.17.633-1.503 1.243-1.602-.89-1.493-3.67-.734-4.556 1.374C7.52 2.602 5.866 0 5.866 0zM4.422 7.217H6.9c2.673 0 2.898.012 3.55.202 1.06.307 1.868.973 2.313 1.904.05.106.092.206.13.305l7.623.008.027 2.912-2.745-.024v7.549l-2.982-.016v-7.522l-2.127.016a2.92 2.92 0 0 1-1.056 1.134c-.287.176-.3.19-.254.264.127.2 2.125 3.642 2.125 3.659l-3.39.019-2.013-3.376c-.034-.047-.122-.068-.344-.084l-.297-.02.037 3.48-3.075-.038zm3.016 2.288l.024.338c.014.186.024.729.024 1.206v.867l.582-.025c.32-.013.695-.049.833-.078.694-.146 1.048-.478 1.087-1.018.027-.378-.063-.636-.303-.87-.318-.309-.761-.416-1.733-.418Z" />
    </svg>
  );
}

function TmdbMark({ score }: { score: number }) {
  // TMDB's signature vote widget: a circular gauge ring (cyan)
  const r = 8.5;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, score / 10));
  const offset = c * (1 - frac);
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
      <circle cx="12" cy="12" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2.6" />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}

function Icon({ source, rotten, score }: { source: Source; rotten: boolean; score: number }) {
  if (source === "imdb") return <ImdbMark />;
  if (source === "rt") return <RtMark rotten={rotten} />;
  return <TmdbMark score={score} />;
}

/* ── Component ──────────────────────────────────────────────────── */

export function CriticsBadge({ source, score, variant = "full", className = "" }: Props) {
  const fresh = source === "rt" ? isFresh(score) : true;
  const accentCls = accent(source, score);
  const aria = `${wordmark(source)} ${format(source, score)}${source === "imdb" || source === "tmdb" ? " out of 10" : ""}`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-2xs font-medium tabular-nums ring-1 ring-white/10 ${accentCls} ${className}`}
      title={aria}
      aria-label={aria}
    >
      <Icon source={source} rotten={!fresh} score={score} />
      {variant === "full" && <span className="font-semibold">{wordmark(source)}</span>}
      <span className="font-semibold">{format(source, score)}</span>
    </span>
  );
}
