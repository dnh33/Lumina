import type { CatalogItem } from "../../lib/types.js";
import { PosterCard } from "../PosterCard.js";

export interface TopicSpine {
  id: number | string;
  label: string;
  items: CatalogItem[];
}

interface Props {
  topics: TopicSpine[];
  /** D7: when provided, each topic spine becomes a clickable control that
   *  emits its topic id. The host page wires this to a client-side filter
   *  (reusing the existing tag-filter logic). Optional for backwards-compat. */
  onTopicSelect?: (topicId: number | string) => void;
}

/**
 * F2 Topic/theme threading (design §13.4). Renders vertical spines of titles
 * per topic. Topic grouping is supplied by the page (currently genre-clustered
 * from real item data); the RAG/keyword deep-version is a later enhancement.
 *
 * D7 (Topic-as-axis): when `onTopicSelect` is supplied, the spine label is a
 * button that fires the callback with the spine's topic id, turning the topic
 * list into a navigable axis.
 */
export function TopicCluster({ topics, onTopicSelect }: Props) {
  if (!topics.length) return null;
  return (
    <section className="space-y-6" aria-label="Topic threads">
      {topics.map((t) => (
        <div key={t.id}>
          {onTopicSelect ? (
            <button
              type="button"
              className="mb-3 cursor-pointer text-sm font-medium uppercase tracking-wide text-white/50 transition-colors hover:text-white/80"
              onClick={() => onTopicSelect(t.id)}
            >
              {t.label}
            </button>
          ) : (
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-white/50">
              {t.label}
            </h3>
          )}
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
