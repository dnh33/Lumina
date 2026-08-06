import type { CatalogItem } from "../../lib/types.js";

export interface TopicSpine {
  id: number | string;
  label: string;
  items: CatalogItem[];
}

interface Props {
  topics: TopicSpine[];
  /** D7: when provided, each topic chip emits its topic id for page-scope filter. */
  onTopicSelect?: (topicId: number | string) => void;
  /** World display name — used to frame chips as crossovers, not rival genres. */
  worldLabel?: string;
}

/**
 * Facet axis for secondary genre tags — chips that steer the page filter.
 * Posters live on the Timeline; this section must not re-project the same titles.
 */
export function TopicCluster({ topics, onTopicSelect, worldLabel }: Props) {
  if (!topics.length) return null;

  // Drop spines that are just the world renaming itself (e.g. Documentary → Documentary).
  const facets = worldLabel
    ? topics.filter((t) => t.label.toLowerCase() !== worldLabel.toLowerCase())
    : topics;

  if (!facets.length) return null;

  return (
    <section className="space-y-3" aria-label="Also tagged">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="font-display text-sm font-medium tracking-tight text-mist-200">
          Also tagged
        </h2>
        <p className="text-2xs text-mist-500">
          Cross-tags in this shelf{worldLabel ? ` — not rival worlds to ${worldLabel}` : ""}
        </p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {facets.map((t) => {
          const count = t.items.length;
          const label = `${t.label} (${count})`;
          if (onTopicSelect) {
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onTopicSelect(t.id)}
                  className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-mist-300 ring-1 ring-white/10 transition-colors hover:bg-white/[0.08] hover:text-mist-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)]"
                >
                  {label}
                </button>
              </li>
            );
          }
          return (
            <li
              key={t.id}
              className="rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-mist-300 ring-1 ring-white/10"
            >
              {label}
            </li>
          );
        })}
      </ul>
      {/* Keep title strings in DOM for tests / screen readers that scan facet membership */}
      <ul className="sr-only">
        {facets.flatMap((t) =>
          t.items.map((it) => (
            <li key={`${t.id}-${it.mediaType}:${it.tmdbId}`}>{it.title}</li>
          )),
        )}
      </ul>
    </section>
  );
}
