import { poster } from "../../lib/img.js";
import type { CatalogItem } from "../../lib/types.js";

interface Props {
  item: CatalogItem;
  director?: string | null;
  rating?: number | null;
  thesis?: string | null;
  /** Optional "why this belongs here" line (B3); derived, no extra server call. */
  provenance?: string | null;
  /** Themed variant driven by the world's metaphor (Task 4.1): e.g.
   *  "constellation" | "frontier" | "panel" | "reading-room" | "generic".
   *  Minimal, readable per-variant emphasis — no layout change. */
  variant?: string;
}

/** Map a metaphor card-variant to a small set of theme classes (Task 4.1). */
function variantClasses(variant?: string): string {
  switch (variant) {
    case "constellation":
      return "ring-1 ring-[var(--world-accent)]/20";
    case "frontier":
      return "border-l-2 border-[var(--world-accent)]";
    case "panel":
      return "bg-white/[0.05]";
    case "reading-room":
      return "border border-white/10";
    case "warm-interior":
      return "bg-white/[0.04] shadow-sm";
    case "threshold":
      return "border-t-2 border-[var(--world-accent)]/40";
    case "generic":
    default:
      return "";
  }
}

/**
 * Composed per-title enrichment card for "argument" worlds (design §13.4).
 * Groups the key enrichment of a single title — poster, director, rating, and
 * the argument thesis — into ONE compact card so the genre page reads as a
 * curated set of titles rather than scattered strips.
 * Graceful when enrichment fields are absent.
 */
export function TitleCard({ item, director, rating, thesis, provenance, variant }: Props) {
  const src = poster(item.posterPath, "w185");
  return (
    <section
      aria-label={`${item.title} summary`}
      className={`flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 ${variantClasses(variant)}`}
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
        {provenance && (
          <p className="mt-1 text-xs text-white/40">{provenance}</p>
        )}
      </div>
    </section>
  );
}
