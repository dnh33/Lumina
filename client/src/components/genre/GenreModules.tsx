import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import type { GenreWorld } from "../../lib/genreWorld.js";
import { SectionHead } from "./SectionHead.js";
import type { CatalogItem, GenreAnchor } from "../../lib/types.js";
import { api } from "../../lib/api.js";
import { TimelineScrubber } from "./TimelineScrubber.js";
import { TopicCluster, type TopicSpine } from "./TopicCluster.js";
import { CredibilityStrip, type Credibility } from "./CredibilityStrip.js";
import { WatchOrderSequencer, type WatchChapter } from "./WatchOrderSequencer.js";
import { ArgumentPanel, type Counterpoint } from "./ArgumentPanel.js";
import { TitleCard } from "./TitleCard.js";
import { GeoMap, type GeoRegion } from "./GeoMap.js";
import { MakerSpotlight } from "./MakerSpotlight.js";
import { ConstellationBackdrop } from "./ConstellationBackdrop.js";
import { FrontierSpine } from "./FrontierSpine.js";
import { genreName } from "../../lib/genreNames.js";
import { accentVar, metaphorLayout } from "../../lib/metaphor.js";
import { fallbackThesisFromItem } from "../../lib/insightThesis.js";
import { libraryWatchlistPath } from "./tonightBag.js";

interface Props {
  modules: GenreWorld["modules"];
  items: CatalogItem[];
  /** optional per-title provenance (F4); keyed by tmdbId */
  credibility?: Record<number, Credibility>;
  /** optional docu-series chapters (F5); keyed by tmdbId */
  watchOrder?: Record<number, { seasons: WatchChapter[]; recommendedStart?: number | null }>;
  /** optional per-title thesis + counterpoint (F3); keyed by tmdbId */
  arguments?: Record<number, { thesis: string; counterpoint?: Counterpoint | null }>;
  /** optional production-region breakdown (geo); keyed by tmdbId */
  geo?: Record<number, GeoRegion[]>;
  /** optional filmmaker spotlight (maker); keyed by tmdbId */
  makers?: Record<number, { director: string | null; directorId: number | null; title: string }>;
  /** Full catalog for the timeline era axis (search/tag filtered, NOT decade-sliced).
   *  When omitted, falls back to `items`. Decade zoom must not collapse this set. */
  timelineItems?: CatalogItem[];
  /** Page-scope decade filter: when set, the TimelineScrubber becomes a
   *  controlled scrubber and the page filters its rails to this decade. */
  selectedDecade?: number | null;
  onDecade?: (decade: number | null) => void;
  /** User's taste anchors (reference titles) — forwarded to the
   *  TimelineScrubber so decades that shaped the user's taste are marked
   *  on the era axis (C9 taste-evolution overlay). */
  anchors?: GenreAnchor[];
  /** Deterministic, LLM-free era thesis for the selected decade (Task 5.2 / D1). */
  eraThesis?: string;
  /** The genre world this page is rendering. Drives metaphor layout + topic framing. */
  world?: GenreWorld;
  /** D7 (Topic-as-axis): topic chips emit genre id for client-side filter. */
  onTopicSelect?: (topicId: number | string) => void;
  /**
   * When true (Guided mode), Featured follows item order — first title with a
   * thesis, else items[0] — matching server rankForGuided / Tonight shelf lead.
   * When false, pick by strongest rating among titled theses (Self).
   */
  preferGuidedFeatured?: boolean;
  /**
   * Mode-split packing stages:
   * - full: Self browse — tray | Featured dual-pane + secondary + maker
   * - claim: Guided park — Argument only (no Featured H2/TitleCard);
   *   shelf owns the fold; GuidedTour wraps this in closed “Argue this pick”
   * - browse: Guided widen / Self secondary (timeline + topics; no featured)
   */
  stage?: "full" | "claim" | "browse";
}

/** Group items into topic spines by shared primary genre id. */
function buildTopics(items: CatalogItem[]): TopicSpine[] {
  const byGenre = new Map<number, CatalogItem[]>();
  for (const it of items) {
    const gid = it.genreIds[0];
    if (gid == null) continue;
    if (!byGenre.has(gid)) byGenre.set(gid, []);
    byGenre.get(gid)!.push(it);
  }
  return [...byGenre.entries()].map(([gid, list]) => ({
    id: gid,
    label: genreName(gid),
    items: list,
  }));
}

/**
 * D6 (Maker index): aggregate recurring directors across the items via the
 * `makers` map. A director is "recurring" when 2+ titles share them.
 */
function buildDirectorIndex(
  items: CatalogItem[],
  makers?: Props["makers"],
): { name: string; count: number }[] {
  if (!makers) return [];
  const byDirector = new Map<string, number>();
  for (const it of items) {
    const m = makers[it.tmdbId];
    if (m?.director) {
      byDirector.set(m.director, (byDirector.get(m.director) ?? 0) + 1);
    }
  }
  return [...byDirector.entries()]
    .filter(([, count]) => count >= 2)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Self: prefer a titled thesis with the strongest rating; else first item.
 * Guided: preserve rail order (tonight lead) — first with thesis, else items[0].
 */
function pickFeatured(
  items: CatalogItem[],
  args?: Props["arguments"],
  preferGuidedOrder = false,
): CatalogItem | null {
  if (!items.length) return null;
  if (preferGuidedOrder) {
    const leadWithThesis = items.find((it) => args?.[it.tmdbId]?.thesis);
    return leadWithThesis ?? items[0] ?? null;
  }
  const withThesis = items.filter((it) => args?.[it.tmdbId]?.thesis);
  const pool = withThesis.length > 0 ? withThesis : items;
  return [...pool].sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))[0] ?? null;
}

/**
 * Single parameterized module host. Renders the genre's enabled modules
 * (per genreWorld.modules) over the experience's items. One component,
 * N configs — NOT N page variants (design §13.8).
 *
 * IA (2026-08-05): Timeline = primary browse. Argument / critic / watch-order
 * attach to ONE featured pick so titles are not restated N times.
 */
export function GenreModules({
  modules,
  items,
  timelineItems,
  credibility,
  watchOrder,
  arguments: args,
  geo,
  makers,
  selectedDecade,
  onDecade,
  anchors,
  world,
  eraThesis,
  onTopicSelect,
  preferGuidedFeatured = false,
  stage = "full",
}: Props) {
  const layout = metaphorLayout(world);
  const accent = accentVar(world);
  const directorIndex = buildDirectorIndex(items, makers);
  /** Self Pass = not-tonight (W2.3); local only — mirrors Guided dismiss, not ignore. */
  const [passedIds, setPassedIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  /** Optimistic watchlist bag for Featured inspect after addToLibrary. */
  const [baggedIds, setBaggedIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );

  const liveItems = items.filter((it) => !passedIds.has(it.tmdbId));
  const featured = pickFeatured(liveItems, args, preferGuidedFeatured);
  const axisItems = timelineItems ?? items;
  const worldLabel = world?.slug
    ? world.slug.charAt(0).toUpperCase() + world.slug.slice(1).replace(/-/g, " ")
    : undefined;

  const watchMut = useMutation({
    mutationFn: (item: CatalogItem) =>
      api.addToLibrary({
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        status: "watchlist",
      }),
    onSuccess: (_entry, item) => {
      setBaggedIds((prev) => new Set(prev).add(item.tmdbId));
    },
  });

  if (layout.backdrop === "none" && modules.length === 0) return null;

  // Parent only hydrates thesis for the current shelf lead. Pass advances
  // Featured locally — synthesize a deterministic fallback so inspect chrome
  // (Watchlist/Pass) does not vanish when the next pick has no lazy arg yet.
  const featuredArg =
    featured == null
      ? undefined
      : (args?.[featured.tmdbId] ??
        (modules.includes("argument")
          ? {
              thesis: fallbackThesisFromItem(featured),
              counterpoint: null as Counterpoint | null,
            }
          : undefined));
  const featuredWo = featured && watchOrder ? watchOrder[featured.tmdbId] : undefined;
  const featuredCred = featured && credibility ? credibility[featured.tmdbId] : undefined;
  const featuredMaker = featured && makers ? makers[featured.tmdbId] : undefined;

  const showTimeline =
    (stage === "full" || stage === "browse") && modules.includes("timeline");
  const showSecondary = stage === "full" || stage === "browse";
  // Roast2 P0: claim fold = dials + shelf + Widen — Featured must not
  // compete as a second primary. Self full keeps tray | inspect.
  const showFeatured =
    stage === "full" &&
    featured != null &&
    ((modules.includes("argument") && !!featuredArg) ||
      (modules.includes("watchorder") && !!featuredWo) ||
      (modules.includes("critic") && !!featuredCred));
  // Claim parks Maker + Featured chrome; Argument alone lives behind
  // GuidedTour’s closed “Argue this pick” disclosure.
  const showClaimArgue =
    stage === "claim" &&
    featured != null &&
    modules.includes("argument") &&
    !!featuredArg;
  const showMaker =
    modules.includes("maker") && !!featuredMaker && stage === "full";

  const featuredInLibrary =
    featured != null &&
    (featured.inLibrary || baggedIds.has(featured.tmdbId));

  const timelineBlock = showTimeline ? (
    <TimelineScrubber
      items={axisItems}
      selectedDecade={selectedDecade}
      onDecade={onDecade}
      anchors={anchors}
      eraThesis={eraThesis}
    />
  ) : null;

  const featuredBlock =
    showFeatured && featured ? (
      <section
        className="space-y-3"
        aria-label="Featured title"
        data-testid="featured-thesis"
      >
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="font-display text-lg font-semibold tracking-tight text-mist-100">
            Featured
          </h2>
          <p className="text-2xs text-mist-500">
            One title from this shelf
          </p>
        </div>

        {modules.includes("argument") && featuredArg && (
          <div className="space-y-3">
            <TitleCard
              item={featured}
              director={featuredMaker?.director ?? null}
              rating={featured.imdbRating ?? null}
              thesis={null}
              provenance={
                featuredArg.counterpoint?.title
                  ? `Pushes back on ${featuredArg.counterpoint.title}`
                  : featured.year != null
                    ? String(featured.year)
                    : null
              }
              variant={layout.cardVariant}
            />
            <ArgumentPanel
              thesis={featuredArg.thesis}
              counterpoint={featuredArg.counterpoint}
              tmdbId={featured.tmdbId}
            />
          </div>
        )}

        {modules.includes("critic") && featuredCred && (
          <CredibilityStrip cred={featuredCred} />
        )}

        {modules.includes("watchorder") && featuredWo && (
          <WatchOrderSequencer
            seasons={featuredWo.seasons}
            recommendedStart={featuredWo.recommendedStart}
          />
        )}

        {/* W2.3: Watchlist/Pass on active Featured only (Self inspect). */}
        <div
          data-testid="featured-claim-actions"
          className="flex flex-wrap items-center gap-2"
        >
          {featuredInLibrary ? (
            <>
              <span className="text-2xs font-semibold text-mist-300">
                In Library
              </span>
              <Link
                to={libraryWatchlistPath()}
                className="world-accent-fill rounded-lg px-2.5 py-1.5 text-2xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)]"
              >
                Open in Library
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={watchMut.isPending}
                aria-label={`Add ${featured.title} to watchlist`}
                onClick={() => watchMut.mutate(featured)}
                className="world-accent-fill rounded-lg px-2.5 py-1.5 text-2xs font-semibold disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)]"
              >
                Watchlist
              </button>
              <button
                type="button"
                disabled={watchMut.isPending}
                aria-label={`Pass on ${featured.title} - not tonight`}
                onClick={() =>
                  setPassedIds((prev) => new Set(prev).add(featured.tmdbId))
                }
                className="rounded-md px-1 py-1.5 text-2xs font-medium text-mist-500 transition-colors hover:text-mist-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)]"
              >
                Pass
              </button>
            </>
          )}
        </div>
      </section>
    ) : null;

  /** Self full: tray | inspect in one fold (roast2 P0). */
  const browseInstrument =
    stage === "full" && timelineBlock && featuredBlock ? (
      <div
        data-testid="browse-inspect"
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)] lg:items-start lg:gap-5"
      >
        <div className="min-w-0 [&_#timeline-rail]:lg:grid-cols-4 [&_#timeline-rail]:xl:grid-cols-5">
          {timelineBlock}
        </div>
        <aside className="min-w-0 lg:sticky lg:top-14 lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto lg:overscroll-contain">
          {featuredBlock}
        </aside>
      </div>
    ) : (
      <>
        {timelineBlock}
        {featuredBlock}
      </>
    );

  return (
    <div
      className={`relative ${stage === "browse" ? "space-y-4" : "space-y-6"}`}
      data-modules-stage={stage}
    >
      {stage === "full" && layout.backdrop === "constellation" && (
        <ConstellationBackdrop accent={accent} />
      )}
      {stage === "full" && layout.backdrop === "frontier" && (
        <FrontierSpine accent={accent} />
      )}

      {browseInstrument}

      {/* Claim park: Argument only — no Featured H2 / TitleCard restating the shelf lead. */}
      {showClaimArgue && featured && featuredArg && (
        <section
          className="space-y-3"
          aria-label="Argue this pick"
          data-testid="claim-argue-park"
        >
          <ArgumentPanel
            thesis={featuredArg.thesis}
            counterpoint={featuredArg.counterpoint}
            tmdbId={featured.tmdbId}
          />
        </section>
      )}

      {showSecondary && modules.includes("topic") && (
        <TopicCluster
          topics={buildTopics(items)}
          onTopicSelect={onTopicSelect}
          worldLabel={worldLabel}
        />
      )}

      {showSecondary && directorIndex.length > 0 && (
        <section className="space-y-3" aria-label="Director index">
          <SectionHead>Filmmakers in this world</SectionHead>
          <ul className="flex flex-wrap gap-2">
            {directorIndex.map(({ name, count }) => (
              <li
                key={name}
                className="rounded-lg bg-white/[0.06] px-3 py-1 text-xs text-mist-300"
                data-testid="director-index-chip"
              >
                {`Director: ${name} (${count} titles)`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {showSecondary &&
        modules.includes("geo") &&
        geo &&
        items.slice(0, 1).map((it) => {
          const regions = geo[it.tmdbId];
          return regions ? (
            <GeoMap key={`geo-${it.mediaType}:${it.tmdbId}`} regions={regions} />
          ) : null;
        })}

      {showMaker && featuredMaker && (
        <MakerSpotlight
          director={featuredMaker.director}
          directorId={featuredMaker.directorId}
          title={featuredMaker.title}
        />
      )}
    </div>
  );
}
