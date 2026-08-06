import { SectionHead } from "./SectionHead.js";

export interface WatchChapter {
  number: number;
  name: string;
  episodeCount: number;
  watched: boolean;
}

interface Props {
  seasons: WatchChapter[];
  /** season number to highlight as the recommended start */
  recommendedStart?: number | null;
}

/**
 * F5 Watch-order for docu-series (design §13.4). Seasons as chapters with a
 * recommended start + in-library progress. Graceful when empty.
 */
export function WatchOrderSequencer({ seasons, recommendedStart }: Props) {
  if (!seasons.length) return null;
  return (
    <section aria-label="Watch order" className="space-y-2">
      <SectionHead>Watch order</SectionHead>
      <ol className="space-y-1">
        {seasons.map((s) => (
          <li
            key={s.number}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
              s.number === recommendedStart ? "bg-[var(--world-accent)]/15 ring-1 ring-[var(--world-accent)]/40" : "bg-white/[0.03]"
            }`}
          >
            <span className="text-xs text-white/40">S{s.number}</span>
            <span className="flex-1 text-sm">{s.name}</span>
            <span className="text-xs text-white/40">{s.episodeCount} eps</span>
            {s.watched && <span className="text-xs text-[var(--world-accent)]">✓</span>}
            {s.number === recommendedStart && (
              <span className="text-xs font-medium text-[var(--world-accent)]">Start here</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
