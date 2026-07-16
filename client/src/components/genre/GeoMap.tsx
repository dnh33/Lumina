import { countryName } from "../../lib/genreNames.js";

export interface GeoRegion {
  code: string;
  name: string;
  count: number;
}

interface Props {
  regions: GeoRegion[];
  /**
   * The user's own library production-country codes (ISO 3166-1 alpha-2).
   * When supplied, the map frames each world region against what the user
   * already has — "in your library" vs "new to you" (Task 6.2 / D4).
   */
  libraryCountries?: string[];
}

/**
 * Geo breakdown (design §13.8 — geo for Travel/War/History archetypes).
 * Clusters titles by production region. Rendered as a share-bar list
 * (no external map lib — honest use of available country data).
 * Graceful when empty.
 *
 * Task 6.2 (D4): ISO codes are resolved to country names via countryName(),
 * and when `libraryCountries` is provided we show a "your region vs world"
 * comparison so the user sees which origins are familiar vs new to them.
 */
export function GeoMap({ regions, libraryCountries = [] }: Props) {
  if (!regions.length) return null;
  const total = regions.reduce((n, r) => n + r.count, 0) || 1;
  const libSet = new Set(libraryCountries);
  return (
    <section aria-label="Where it's from" className="space-y-2">
      <h3 className="text-sm font-medium uppercase tracking-wide text-white/50">
        Where it&rsquo;s from
      </h3>
      <ul className="space-y-1">
        {regions.map((r) => {
          const name = r.name || countryName(r.code);
          const inLibrary = libSet.has(r.code);
          return (
            <li key={r.code} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-white/70">{name}</span>
              <span className="h-2 flex-1 overflow-hidden rounded bg-white/[0.06]">
                <span
                  className="block h-full bg-[var(--world-accent)]/70"
                  style={{ width: `${Math.round((r.count / total) * 100)}%` }}
                />
              </span>
              <span className="w-8 text-right text-xs text-white/40">{r.count}</span>
              <span
                className={`text-2xs ${inLibrary ? "text-[var(--world-accent)]/80" : "text-[var(--world-accent)]/60"}`}
                title={inLibrary ? "In your library" : "New to you"}
              >
                {inLibrary ? "in your library" : "new to you"}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
