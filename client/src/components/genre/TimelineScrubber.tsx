import { useMemo, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { poster } from "../../lib/img.js";
import type { CatalogItem, GenreAnchor } from "../../lib/types.js";

interface Props {
  items: CatalogItem[];
  /** Controlled selected decade (null = all eras). When provided, the parent owns
   *  the truth and the scrubber filters page-scope. */
  selectedDecade?: number | null;
  /** Called when the user picks a decade tab, All eras, or steps via the arrows. */
  onDecade?: (decade: number | null) => void;
  /** User's taste anchors (reference titles). When supplied, decades that
   *  contain at least one anchor get a small marker on the era axis (C9
   *  taste-evolution overlay) so the user can see WHERE their taste lives.
   *  This is purely additive — it never changes decade filtering. */
  anchors?: GenreAnchor[];
  /** Deterministic, LLM-free era thesis for the currently selected decade
   *  (Task 5.2 / D1). When `selectedDecade` is set AND this is provided, the
   *  scrubber enters a zoomed state and surfaces this line. Computed by the
   *  page from decade + world.metaphor + item count — no server endpoint. */
  eraThesis?: string;
}

/** Floor a year to its decade. Exported so the genre page can filter by the
 *  same bucketing the scrubber uses (page-scope decade filter). */
export function decadeOf(year: number | null): number {
  if (year == null) return 0;
  return Math.floor(year / 10) * 10;
}

const labelFor = (decade: number) => (decade === 0 ? "Unknown" : `${decade}s`);

/**
 * Decade-first landing: densest era, bias toward taste-anchor decades,
 * then most recent on ties. Skips the "Unknown" (yearless) bucket.
 * Page shell (orchestrator) should call this for Self bootstrap.
 */
export function pickPreferredDecade(
  items: CatalogItem[],
  anchors?: GenreAnchor[],
): number | null {
  const counts = new Map<number, number>();
  for (const it of items) {
    const d = decadeOf(it.year);
    if (d === 0) continue;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  if (counts.size === 0) return null;

  const anchorDecades = new Set<number>();
  for (const a of anchors ?? []) {
    const d = decadeOf(a.year ?? null);
    if (d !== 0) anchorDecades.add(d);
  }

  return [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    const aHit = anchorDecades.has(a[0]) ? 1 : 0;
    const bHit = anchorDecades.has(b[0]) ? 1 : 0;
    if (bHit !== aHit) return bHit - aHit;
    return b[0] - a[0];
  })[0]![0];
}

/** Peek posters for All-eras decade summary — never the full warehouse. */
const SUMMARY_PEEK = 2;

/**
 * Primary browse surface for a genre world — era axis + projection tray.
 * Controlled `null` = All eras zoom-out (decade summary, not page dump).
 * Uncontrolled defaults to densest preferred decade (standalone demos).
 * Zoomed decade posters live in an internal-scroll tray so page length
 * is not proportional to title count (mode-split packing Wave 1).
 */
export function TimelineScrubber({ items, selectedDecade, onDecade, anchors, eraThesis }: Props) {
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

  const anchorDecades = useMemo(() => {
    const set = new Set<number>();
    for (const a of anchors ?? []) {
      const d = decadeOf(a.year ?? null);
      if (d !== 0) set.add(d);
    }
    return set;
  }, [anchors]);

  const controlled = onDecade != null;
  const [internal, setInternal] = useState<number | null>(() =>
    pickPreferredDecade(items, anchors) ?? decades[0]?.[0] ?? null,
  );

  // Controlled: null means All eras (explicit). Uncontrolled: preferred decade.
  const selected: number | null = controlled ? (selectedDecade ?? null) : internal;
  const allEras = selected == null;
  const visible = allEras
    ? items
    : (decades.find(([d]) => d === selected)?.[1] ?? []);

  if (items.length === 0) return null;

  const sortedDecades = decades.map(([d]) => d);
  const currentIdx = selected == null ? -1 : sortedDecades.indexOf(selected);
  const step = (dir: -1 | 1) => {
    if (!controlled) return;
    if (selected == null) {
      // From All eras: next → earliest, prev → latest
      const target = dir === 1 ? sortedDecades[0] : sortedDecades[sortedDecades.length - 1];
      if (target != null) onDecade?.(target);
      return;
    }
    const nextIdx = currentIdx + dir;
    const nextDecade = sortedDecades[nextIdx];
    if (nextDecade == null) return;
    onDecade?.(nextDecade);
  };
  const atStart = selected != null && currentIdx <= 0;
  const atEnd = selected != null && currentIdx >= sortedDecades.length - 1;
  // From All eras, both arrows are available (jump to ends of the axis).
  const prevDisabled = controlled && selected != null && atStart;
  const nextDisabled = controlled && selected != null && atEnd;

  const zoomed = controlled && selectedDecade != null;

  const pickDecade = (decade: number | null) => {
    if (controlled) onDecade?.(decade);
    else if (decade != null) setInternal(decade);
  };

  /** WAI-ARIA tabs: arrows move focus + select; Home/End jump ends. */
  const onTabListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'),
    );
    if (tabs.length === 0) return;
    const idx = tabs.indexOf(e.target as HTMLElement);
    if (idx < 0) return;

    let next = idx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = (idx + 1) % tabs.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = (idx - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    const target = tabs[next];
    target?.focus();
    target?.click();
  };

  // Count only when zoomed - selected tab already names the decade (no echo).
  const statusLine = allEras
    ? `${items.length} title${items.length === 1 ? "" : "s"} · pick an era`
    : `${visible.length} title${visible.length === 1 ? "" : "s"}`;

  return (
    <section
      data-zoomed={zoomed ? "true" : "false"}
      data-eras={allEras ? "all" : "decade"}
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-850/40 p-3 sm:p-4"
      aria-label="Timeline"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--world-accent,#e8b84b)]/35 to-transparent"
      />

      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2
            id="timeline-heading"
            className="font-display text-lg font-semibold tracking-tight text-mist-100"
          >
            Timeline
          </h2>
          <p className="mt-0.5 text-2xs text-mist-500" aria-live="polite">
            {statusLine}
          </p>
        </div>
      </div>

      {/* Prev/Next outside tablist — only [role=tab] children belong inside. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Previous decade"
          aria-disabled={prevDisabled || undefined}
          disabled={prevDisabled || undefined}
          onClick={() => step(-1)}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-mist-300 transition-colors hover:text-mist-100 disabled:cursor-default disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] ${
            controlled ? "" : "hidden"
          }`}
        >
          ◀
        </button>

        <div
          role="tablist"
          aria-labelledby="timeline-heading"
          onKeyDown={onTabListKeyDown}
          className="flex flex-wrap items-center gap-2"
        >
          {controlled && (
            <button
              type="button"
              id="timeline-tab-all"
              role="tab"
              aria-selected={allEras}
              aria-controls="timeline-era-summary"
              tabIndex={allEras ? 0 : -1}
              onClick={() => pickDecade(null)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] ${
                allEras
                  ? "bg-[var(--world-accent,#e8b84b)]/90 font-medium text-ink-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "border border-white/[0.08] text-mist-300 hover:text-mist-100"
              }`}
            >
              All eras
            </button>
          )}

          {decades.map(([decade, bucket]) => {
            const active = !allEras && decade === selected;
            const tabId = `timeline-tab-${decade}`;
            return (
              <button
                key={decade}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="timeline-rail"
                tabIndex={active ? 0 : -1}
                aria-label={`${labelFor(decade)}, ${bucket.length} title${bucket.length === 1 ? "" : "s"}`}
                onClick={() => pickDecade(decade)}
                className={`relative rounded-lg px-3 py-1.5 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] ${
                  active
                    ? "bg-ink-700 text-mist-100 ring-1 ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "border border-white/[0.08] text-mist-300 hover:text-mist-100"
                }`}
                data-zoom={active ? "true" : undefined}
              >
                <span aria-hidden>{labelFor(decade)}</span>
                <span
                  aria-hidden
                  className={`ml-1.5 text-2xs tabular-nums ${active ? "text-mist-300" : "text-mist-600"}`}
                >
                  {bucket.length}
                </span>
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
        </div>

        <button
          type="button"
          aria-label="Next decade"
          aria-disabled={nextDisabled || undefined}
          disabled={nextDisabled || undefined}
          onClick={() => step(1)}
          className={`flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-mist-300 transition-colors hover:text-mist-100 disabled:cursor-default disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] ${
            controlled ? "" : "hidden"
          }`}
        >
          ▶
        </button>
      </div>

      {zoomed && eraThesis && (
        <p
          data-testid="era-thesis"
          className="mb-3 max-w-2xl font-display text-sm italic leading-relaxed text-mist-200"
        >
          {eraThesis}
        </p>
      )}

      {/* All-eras: horizontal decade summary — never unbounded poster dump.
          Peek cards zoom into that decade tray via onDecade (page owns URL). */}
      {allEras ? (
        <motion.div
          id="timeline-era-summary"
          data-testid="timeline-era-summary"
          role="group"
          tabIndex={0}
          aria-label="Eras overview — pick a decade to open its tray"
          className="flex gap-3 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-gutter:stable] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--world-accent,#e8b84b)]"
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {decades.map(([decade, bucket]) => {
            const peeks = bucket.slice(0, SUMMARY_PEEK);
            const hasAnchor = anchorDecades.has(decade);
            return (
              <button
                key={decade}
                type="button"
                data-testid={`era-summary-${decade}`}
                aria-label={`${labelFor(decade)}, ${bucket.length} title${bucket.length === 1 ? "" : "s"}. Open era tray.`}
                onClick={() => pickDecade(decade)}
                className="group relative flex min-w-[8.5rem] max-w-[10rem] shrink-0 flex-col gap-2 rounded-xl border border-white/[0.06] bg-ink-900/40 p-2.5 text-left transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[var(--world-accent,#e8b84b)]/40 hover:bg-ink-900/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-sm font-medium text-mist-100" aria-hidden>
                    {labelFor(decade)}
                  </span>
                  <span className="text-2xs tabular-nums text-mist-500" aria-hidden>
                    {bucket.length}
                  </span>
                </div>
                <div className="flex gap-1.5" aria-hidden>
                  {peeks.map((it) => {
                    const src = poster(it.posterPath, "w185");
                    return (
                      <div
                        key={`${it.mediaType}:${it.tmdbId}`}
                        className="aspect-[2/3] w-[2.75rem] overflow-hidden rounded-md bg-ink-800 ring-1 ring-white/10"
                      >
                        {src ? (
                          <img
                            src={src}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center p-0.5 text-center text-[0.55rem] leading-tight text-mist-600">
                            {it.title.slice(0, 12)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {bucket.length > SUMMARY_PEEK && (
                    <div className="flex aspect-[2/3] w-[2.75rem] items-center justify-center rounded-md bg-ink-800/80 text-2xs tabular-nums text-mist-500 ring-1 ring-white/[0.06]">
                      +{bucket.length - SUMMARY_PEEK}
                    </div>
                  )}
                </div>
                <span
                  className="text-2xs text-mist-500 transition-colors group-hover:text-[var(--world-accent,#e8b84b)]/90"
                  aria-hidden
                >
                  Open tray →
                </span>
                {hasAnchor && (
                  <span
                    data-testid={`summary-anchor-${decade}`}
                    className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-gold-400/90"
                    title="Taste anchor in this era"
                  />
                )}
              </button>
            );
          })}
        </motion.div>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-mist-500">
          Nothing in this era for the current filters. Try All eras or clear a tag.
        </p>
      ) : (
        <>
        <div
          data-testid="timeline-tray"
          className="relative rounded-xl border border-white/[0.05] bg-ink-900/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          <a
            href="#after-timeline-tray"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("after-timeline-tray")?.focus();
            }}
            className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-20 focus:rounded-md focus:bg-[var(--world-accent,#e8b84b)] focus:px-2.5 focus:py-1.5 focus:text-2xs focus:font-medium focus:text-ink-950"
          >
            Skip title tray
          </a>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-3 top-0 z-10 h-5 bg-gradient-to-b from-ink-900/55 to-transparent"
          />
          <div
            role="region"
            tabIndex={0}
            aria-label={`Title tray, ${labelFor(selected!)}, ${visible.length} titles`}
            className="max-h-[min(70vh,36rem)] overflow-y-auto overscroll-contain px-2.5 py-3 sm:px-3 [scrollbar-gutter:stable] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--world-accent,#e8b84b)]"
          >
            {/* GOLD NUGGET — tray scroll perf: dense decade grids stay mounted;
                content-visibility skips off-screen layout/paint. Keeps decade-
                first / All-eras summary packing; no react-window (grid +
                variable height). Same CSS pattern as ChatThread. */}
            <motion.ul
              id="timeline-rail"
              role="tabpanel"
              aria-labelledby={
                selected != null ? `timeline-tab-${selected}` : "timeline-heading"
              }
              key={String(selected)}
              className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {visible.map((it) => {
                const src = poster(it.posterPath, "w185");
                return (
                  <li
                    key={`${it.mediaType}:${it.tmdbId}`}
                    className="[content-visibility:auto] [contain-intrinsic-size:auto_260px]"
                  >
                    <Link
                      to={`/title/${it.mediaType}/${it.tmdbId}`}
                      aria-label={`${it.title}${it.year != null ? ` (${it.year})` : ""}`}
                      className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)]"
                    >
                      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-ink-800 ring-1 ring-white/10 transition-[box-shadow,ring-color] duration-300 group-hover:ring-[var(--world-accent,#e8b84b)]/40">
                        {src ? (
                          <img
                            src={src}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="flex h-full items-center justify-center p-2 text-center text-xs text-mist-500"
                          >
                            {it.title}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 truncate font-sans text-xs text-mist-200 group-hover:text-mist-50" aria-hidden>
                        {it.title}
                      </p>
                      {it.year != null && (
                        <p className="text-2xs tabular-nums text-mist-500" aria-hidden>
                          {it.year}
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </motion.ul>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-3 bottom-0 z-10 h-5 bg-gradient-to-t from-ink-900/55 to-transparent"
          />
        </div>
        <div
          id="after-timeline-tray"
          tabIndex={-1}
          className="sr-only"
        >
          End of title tray
        </div>
        </>
      )}
    </section>
  );
}
