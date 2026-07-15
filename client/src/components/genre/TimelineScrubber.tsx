import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CatalogItem, GenreAnchor } from "../../lib/types.js";

interface Props {
  items: CatalogItem[];
  /** Controlled selected decade (null = all). When provided, the parent owns
   *  the truth and the scrubber filters page-scope. */
  selectedDecade?: number | null;
  /** Called when the user picks a decade tab or steps via the arrows. */
  onDecade?: (decade: number | null) => void;
  /** User's taste anchors (reference titles). When supplied, decades that
   *  contain at least one anchor get a small marker on the era axis (C9
   *  taste-evolution overlay) so the user can see WHERE their taste lives.
   *  This is purely additive — it never changes decade filtering. */
  anchors?: GenreAnchor[];
}

/** Floor a year to its decade. Exported so the genre page can filter by the
 *  same bucketing the scrubber uses (page-scope decade filter). */
export function decadeOf(year: number | null): number {
  if (year == null) return 0;
  return Math.floor(year / 10) * 10;
}

const labelFor = (decade: number) => (decade === 0 ? "Unknown" : `${decade}s`);

export function TimelineScrubber({ items, selectedDecade, onDecade, anchors }: Props) {
  const reduce = useReducedMotion();
  const decades = useMemo(() => {
    const map = new Map<number, CatalogItem[]>();
    for (const it of items) {
      const d = decadeOf(it.year);
      const bucket = map.get(d) ?? [];
      bucket.push(it);
      map.set(d, bucket);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [items]);

  // C9: bucket anchors by decade so the era axis can show WHERE the user's
  // taste lives. Anchors without a resolvable year are skipped. Purely
  // additive — never affects the item grid or decade filtering above.
  const anchorDecades = useMemo(() => {
    const set = new Set<number>();
    for (const a of anchors ?? []) {
      const d = decadeOf(a.year ?? null);
      if (d !== 0) set.add(d);
    }
    return set;
  }, [anchors]);

  // Controlled mode: the parent owns `selectedDecade`. Uncontrolled fallback
  // keeps the old local-state behaviour for any direct standalone usage.
  const controlled = onDecade != null;
  const [internal, setInternal] = useState<number>(() => decades[0]?.[0] ?? 0);
  const selected = controlled ? (selectedDecade ?? decades[0]?.[0] ?? 0) : internal;
  const visible = decades.find(([d]) => d === selected)?.[1] ?? [];

  if (items.length === 0) return null;

  const sortedDecades = decades.map(([d]) => d);
  const currentIdx = sortedDecades.indexOf(selected);
  const step = (dir: -1 | 1) => {
    const nextIdx = currentIdx + dir;
    const nextDecade = sortedDecades[nextIdx];
    if (nextDecade == null) return;
    onDecade?.(nextDecade);
  };
  const atStart = currentIdx <= 0;
  const atEnd = currentIdx >= sortedDecades.length - 1;

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6" aria-label="Timeline">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-[var(--font-display)] text-lg font-semibold tracking-tight text-white/90">
          Timeline
        </h2>
        <span className="text-xs uppercase tracking-wider text-white/40">scrub by era</span>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2" role="tablist" aria-label="Decades">
        <button
          type="button"
          aria-label="Previous decade"
          aria-disabled={controlled ? atStart : undefined}
          disabled={controlled ? atStart : undefined}
          onClick={() => step(-1)}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] text-white/60 transition-colors hover:text-white/90 disabled:cursor-default disabled:opacity-30 ${
            controlled ? "" : "hidden"
          }`}
        >
          ◀
        </button>
        {decades.map(([decade]) => {
          const active = decade === selected;
          return (
            <button
              key={decade}
              role="tab"
              aria-selected={active}
              onClick={() => (controlled ? onDecade?.(decade) : setInternal(decade))}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                active
                  ? "bg-[var(--world-accent)]/90 text-ink-950"
                  : "border border-white/[0.08] text-white/60 hover:text-white/90"
              }`}
            >
              {labelFor(decade)}
              {anchorDecades.has(decade) && (
                <span
                  data-testid={`anchor-${decade}`}
                  aria-label={`Taste anchor in the ${labelFor(decade)}`}
                  title="A title that shaped your taste lives in this era"
                  className="ml-1 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-gold-400/90 align-middle"
                />
              )}
            </button>
          );
        })}
        <button
          type="button"
          aria-label="Next decade"
          aria-disabled={controlled ? atEnd : undefined}
          disabled={controlled ? atEnd : undefined}
          onClick={() => step(1)}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] text-white/60 transition-colors hover:text-white/90 disabled:cursor-default disabled:opacity-30 ${
            controlled ? "" : "hidden"
          }`}
        >
          ▶
        </button>
      </div>

      <motion.ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduce ? 0 : 0.25 }}
      >
        {visible.map((it) => (
          <li
            key={`${it.mediaType}:${it.tmdbId}`}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
          >
            <p className="truncate font-[var(--font-sans)] text-sm text-white/90">{it.title}</p>
            {it.year != null && <p className="text-xs text-white/40">{it.year}</p>}
          </li>
        ))}
      </motion.ul>
    </section>
  );
}
