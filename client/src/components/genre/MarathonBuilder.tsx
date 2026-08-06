import { useState } from "react";
import { SectionHead } from "./SectionHead.js";

export interface MarathonSeason {
  number: number;
  name: string;
  episodeCount: number;
  watched?: boolean;
}

export interface MarathonWatchlistItem {
  title: string;
  year?: number;
}

interface Props {
  slug: string;
  /** Docu-series chapters pulled from the watchorder module. */
  seasons: MarathonSeason[];
  /** Saved watchlist titles the user wants in the run. */
  watchlist: MarathonWatchlistItem[];
}

interface PlaylistEntry {
  title: string;
  year?: number;
  kind: "season" | "watchlist";
}

/**
 * MarathonBuilder (Task 6.6 / C7).
 *
 * Sequences a marathon from the world's cross-title watch order (seasons from
 * the `watchorder` module) plus the user's watchlist, then saves it as a
 * playlist under `lumina:marathon:${slug}` in localStorage. Pure client-side;
 * no server touch. Exposes a printable view of the saved run.
 */
export function MarathonBuilder({ slug, seasons = [], watchlist = [] }: Props) {
  const [playlist, setPlaylist] = useState<PlaylistEntry[] | null>(null);
  const [printable, setPrintable] = useState(false);

  const build = () => {
    // N7: skip seasons the user has already watched — unless that would empty
    // the marathon, in which case keep everything so it's never blank.
    const unwatchedSeasons = seasons.filter((s) => !s.watched);
    const seasonsToUse = unwatchedSeasons.length > 0 ? unwatchedSeasons : seasons;
    const entries: PlaylistEntry[] = [
      ...seasonsToUse.map((s) => ({ title: s.name, kind: "season" as const })),
      ...watchlist.map((w) => ({ title: w.title, year: w.year, kind: "watchlist" as const })),
    ];
    localStorage.setItem(
      `lumina:marathon:${slug}`,
      JSON.stringify({ slug, entries }),
    );
    setPlaylist(entries);
    setPrintable(false);
  };

  return (
    <section aria-label="Marathon builder" className="space-y-3">
      <div className="flex items-center gap-3">
        <SectionHead className="flex-1 mb-0">Marathon</SectionHead>
        <button
          type="button"
          onClick={build}
          className="rounded-full bg-gold-400 px-4 py-1.5 text-2xs font-medium text-ink-950"
        >
          Build marathon
        </button>
        {playlist && (
          <button
            type="button"
            onClick={() => setPrintable((p) => !p)}
            className="rounded-full bg-white/[0.06] px-3 py-1.5 text-2xs font-medium text-white/70 ring-1 ring-white/10"
          >
            Printable
          </button>
        )}
      </div>

      {playlist && (
        <ol data-testid="marathon-playlist" className="space-y-1">
          {playlist.map((e, i) => (
            <li key={`${e.kind}-${i}`} className="flex items-center gap-3 text-sm">
              <span className="w-6 text-right text-xs text-white/40">{i + 1}.</span>
              <span className="flex-1 text-white/80">{e.title}</span>
              <span className="text-2xs uppercase tracking-wider text-white/40">{e.kind}</span>
            </li>
          ))}
        </ol>
      )}

      {printable && playlist && (
        <div
          data-testid="marathon-printable"
          className="rounded-lg bg-white/5 p-4 text-sm text-white/80"
        >
          <h4 className="mb-2 font-medium text-white/90">Marathon — {slug}</h4>
          <ol className="list-decimal pl-5">
            {playlist.map((e, i) => (
              <li key={`p-${e.kind}-${i}`}>{e.title}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
