import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { CatalogItem } from "../../lib/types.js";

interface Props {
  items: CatalogItem[];
}

function decadeOf(year: number | null): number {
  if (year == null) return 0;
  return Math.floor(year / 10) * 10;
}

const labelFor = (decade: number) => (decade === 0 ? "Unknown" : `${decade}s`);

export function TimelineScrubber({ items }: Props) {
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

  const [selected, setSelected] = useState<number>(() => decades[0]?.[0] ?? 0);
  const visible = decades.find(([d]) => d === selected)?.[1] ?? [];

  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6" aria-label="Timeline">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-[var(--font-display)] text-lg font-semibold tracking-tight text-white/90">
          Timeline
        </h2>
        <span className="text-xs uppercase tracking-wider text-white/40">scrub by era</span>
      </div>

      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Decades">
        {decades.map(([decade]) => {
          const active = decade === selected;
          return (
            <button
              key={decade}
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(decade)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                active
                  ? "bg-amber-400/90 text-ink-950"
                  : "border border-white/[0.08] text-white/60 hover:text-white/90"
              }`}
            >
              {labelFor(decade)}
            </button>
          );
        })}
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
