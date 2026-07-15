import { poster } from "../../lib/img.js";
import type { CatalogItem } from "../../lib/types.js";

interface Props {
  item: CatalogItem;
  director?: string | null;
  rating?: number | null;
  thesis?: string | null;
}

/**
 * Composed per-title enrichment card for "argument" worlds (design §13.4).
 * Groups the key enrichment of a single title — poster, director, rating, and
 * the argument thesis — into ONE compact card so the genre page reads as a
 * curated set of titles rather than scattered strips.
 * Graceful when enrichment fields are absent.
 */
export function TitleCard({ item, director, rating, thesis }: Props) {
  const src = poster(item.posterPath, "w185");
  return (
    <section
      aria-label={`${item.title} summary`}
      className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
    >
      {src && (
        <img
          src={src}
          alt={item.title}
          className="h-24 w-16 flex-none rounded-md object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-white/90">{item.title}</h4>
        {director && (
          <p className="text-xs text-white/50">Dir. {director}</p>
        )}
        {rating != null && (
          <p className="text-xs text-white/50">★ {rating}</p>
        )}
        {thesis && (
          <p className="mt-1 text-xs leading-relaxed text-white/70">{thesis}</p>
        )}
      </div>
    </section>
  );
}
