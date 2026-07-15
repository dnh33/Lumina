import type { GenreWorld } from "../../lib/genreWorld.js";
import type { CatalogItem } from "../../lib/types.js";
import { TimelineScrubber } from "./TimelineScrubber.js";
import { TopicCluster, type TopicSpine } from "./TopicCluster.js";

interface Props {
  modules: GenreWorld["modules"];
  items: CatalogItem[];
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
export function GenreModules({ modules, items }: Props) {
  return (
    <>
      {modules.includes("timeline") && <TimelineScrubber items={items} />}
      {modules.includes("topic") && <TopicCluster topics={buildTopics(items)} />}
    </>
  );
}
