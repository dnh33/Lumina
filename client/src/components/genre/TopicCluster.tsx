import type { CatalogItem } from "../../lib/types.js";
import { PosterCard } from "../PosterCard.js";

export interface TopicSpine {
  label: string;
  items: CatalogItem[];
}

interface Props {
  topics: TopicSpine[];
}

/**
 * F2 Topic/theme threading (design §13.4). Renders vertical spines of titles
 * per topic. Topic grouping is supplied by the page (currently genre-clustered
 * from real item data); the RAG/keyword deep-version is a later enhancement.
 */
export function TopicCluster({ topics }: Props) {
  if (!topics.length) return null;
  return (
    <section className="space-y-6" aria-label="Topic threads">
      {topics.map((t) => (
        <div key={t.label}>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-white/50">
            {t.label}
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {t.items.map((it) => (
              <PosterCard
                key={`${it.mediaType}:${it.tmdbId}`}
                item={it}
                width="w-40 shrink-0"
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
