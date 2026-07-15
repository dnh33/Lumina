export interface GeoRegion {
  code: string;
  name: string;
  count: number;
}

interface Props {
  regions: GeoRegion[];
}

/**
 * Geo breakdown (design §13.8 — geo for Travel/War/History archetypes).
 * Clusters titles by production region. Rendered as a share-bar list
 * (no external map lib — honest use of available country data).
 * Graceful when empty.
 */
export function GeoMap({ regions }: Props) {
  if (!regions.length) return null;
  const total = regions.reduce((n, r) => n + r.count, 0) || 1;
  return (
    <section aria-label="Where it's from" className="space-y-2">
      <h3 className="text-sm font-medium uppercase tracking-wide text-white/50">
        Where it&rsquo;s from
      </h3>
      <ul className="space-y-1">
        {regions.map((r) => (
          <li key={r.code} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 text-white/70">{r.name}</span>
            <span className="h-2 flex-1 overflow-hidden rounded bg-white/[0.06]">
              <span
                className="block h-full bg-[var(--world-accent)]/70"
                style={{ width: `${Math.round((r.count / total) * 100)}%` }}
              />
            </span>
            <span className="w-8 text-right text-xs text-white/40">{r.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
