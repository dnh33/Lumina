import type { GenreWorld } from "../../lib/genreWorld.js";
import type { CatalogItem } from "../../lib/types.js";
import { TimelineScrubber } from "./TimelineScrubber.js";
import { TopicCluster, type TopicSpine } from "./TopicCluster.js";
import { CredibilityStrip, type Credibility } from "./CredibilityStrip.js";
import { WatchOrderSequencer, type WatchChapter } from "./WatchOrderSequencer.js";
import { ArgumentPanel, type Counterpoint } from "./ArgumentPanel.js";

interface Props {
  modules: GenreWorld["modules"];
  items: CatalogItem[];
  /** optional per-title provenance (F4); keyed by tmdbId */
  credibility?: Record<number, Credibility>;
  /** optional docu-series chapters (F5); keyed by tmdbId */
  watchOrder?: Record<number, { seasons: WatchChapter[]; recommendedStart?: number | null }>;
  /** optional per-title thesis + counterpoint (F3); keyed by tmdbId */
  arguments?: Record<number, { thesis: string; counterpoint?: Counterpoint | null }>;
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
    label: `Genre ${gid}`,
    items: list,
  }));
}

/**
 * Single parameterized module host. Renders the genre's enabled modules
 * (per genreWorld.modules) over the experience's items. One component,
 * N configs — NOT N page variants (design §13.8).
 */
export function GenreModules({ modules, items, credibility, watchOrder, arguments: args }: Props) {
  return (
    <>
      {modules.includes("timeline") && <TimelineScrubber items={items} />}
      {modules.includes("topic") && <TopicCluster topics={buildTopics(items)} />}
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
          return a ? (
            <ArgumentPanel key={`arg-${it.mediaType}:${it.tmdbId}`} thesis={a.thesis} counterpoint={a.counterpoint} />
          ) : null;
        })}
    </>
  );
}
