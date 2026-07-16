import type { GenreWorld } from "../../lib/genreWorld.js";
import type { CatalogItem, GenreAnchor } from "../../lib/types.js";
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
  /** Page-scope decade filter: when set, the TimelineScrubber becomes a
   *  controlled scrubber and the page filters its rails to this decade. */
  selectedDecade?: number | null;
  onDecade?: (decade: number | null) => void;
  /** User's taste anchors (reference titles) — forwarded to the
   *  TimelineScrubber so decades that shaped the user's taste are marked
   *  on the era axis (C9 taste-evolution overlay). */
  anchors?: GenreAnchor[];
  /** Deterministic, LLM-free era thesis for the selected decade (Task 5.2 / D1).
   *  Forwarded to the TimelineScrubber so it can show the zoomed-era thesis line.
   *  Computed by the page from decade + world.metaphor + item count. */
  eraThesis?: string;
  /** The genre world this page is rendering. Drives the metaphor layout
   *  grammar (Task 4.1): a decorative backdrop for the Constellation/Frontier
   *  flagships + a themed TitleCard variant for every world. Optional for
   *  backwards-compat with callers that don't pass it. */
  world?: GenreWorld;
  /** D7 (Topic-as-axis): when provided, the topic spines rendered by the
   *  `topic` module become clickable controls that emit their topic (genre)
   *  id. The page threads this to a client-side filter (reusing the existing
   *  tag-filter logic). Optional. */
  onTopicSelect?: (topicId: number | string) => void;
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
 * `makers` map. A director is "recurring" when 2+ titles share them. Returns
 * them sorted by count desc, then name, for a compact index block.
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
 * Single parameterized module host. Renders the genre's enabled modules
 * (per genreWorld.modules) over the experience's items. One component,
 * N configs — NOT N page variants (design §13.8).
 */
export function GenreModules({ modules, items, credibility, watchOrder, arguments: args, geo, makers, selectedDecade, onDecade, anchors, world, eraThesis, onTopicSelect }: Props) {
  const layout = metaphorLayout(world);
  const accent = accentVar(world);
  const directorIndex = buildDirectorIndex(items, makers);
  // Nothing to render (no backdrop, no enabled modules) -> render nothing so
  // the host page doesn't get a stray empty wrapper element.
  if (layout.backdrop === "none" && modules.length === 0) return null;
  return (
    <div className="relative">
      {layout.backdrop === "constellation" && <ConstellationBackdrop accent={accent} />}
      {layout.backdrop === "frontier" && <FrontierSpine accent={accent} />}
      {modules.includes("timeline") && (
        <TimelineScrubber items={items} selectedDecade={selectedDecade} onDecade={onDecade} anchors={anchors} eraThesis={eraThesis} />
      )}
      {modules.includes("topic") && <TopicCluster topics={buildTopics(items)} onTopicSelect={onTopicSelect} />}
      {directorIndex.length > 0 && (
        <section className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4" aria-label="Director index">
          <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-white/50">Filmmakers in this world</h3>
          <ul className="flex flex-wrap gap-2">
            {directorIndex.map(({ name, count }) => (
              <li
                key={name}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70"
                data-testid="director-index-chip"
              >
                {`Director: ${name} (${count} titles)`}
              </li>
            ))}
          </ul>
        </section>
      )}
      {modules.includes("critic") &&
        credibility &&
        items.map((it) => (
          <CredibilityStrip key={`cred-${it.mediaType}:${it.tmdbId}`} cred={credibility[it.tmdbId] ?? {}} />
        ))}
      {modules.includes("watchorder") &&
        watchOrder &&
        items.map((it) => {
          const wo = watchOrder[it.tmdbId];
          return wo ? (
            <WatchOrderSequencer key={`wo-${it.mediaType}:${it.tmdbId}`} seasons={wo.seasons} recommendedStart={wo.recommendedStart} />
          ) : null;
        })}
      {modules.includes("argument") &&
        args &&
        items.map((it) => {
          const a = args[it.tmdbId];
          if (!a) return null;
          const director = makers?.[it.tmdbId]?.director ?? null;
          const rating = it.imdbRating ?? null;
          const provenance = a.counterpoint
            ? `Pushes back on ${a.counterpoint.title}`
            : director
              ? `From the team behind ${director}`
              : null;
          return (
            <div key={`arg-${it.mediaType}:${it.tmdbId}`} className="space-y-2">
              <TitleCard item={it} director={director} rating={rating} thesis={a.thesis} provenance={provenance} variant={layout.cardVariant} />
              <ArgumentPanel thesis={a.thesis} counterpoint={a.counterpoint} />
            </div>
          );
        })}
      {modules.includes("geo") &&
        geo &&
        items.map((it) => {
          const regions = geo[it.tmdbId];
          return regions ? (
            <GeoMap key={`geo-${it.mediaType}:${it.tmdbId}`} regions={regions} />
          ) : null;
        })}
      {modules.includes("maker") &&
        makers &&
        items.map((it) => {
          const m = makers[it.tmdbId];
          return m ? (
            <MakerSpotlight key={`mk-${it.mediaType}:${it.tmdbId}`} director={m.director} directorId={m.directorId} title={it.title} />
          ) : null;
        })}
    </div>
  );
}
