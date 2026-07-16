import type { CatalogItem } from "../../lib/types.js";

export interface Credibility {
  distributor?: string | null;
  streaming?: boolean | null;
  consensus?: string | null;
  stance?: string | null;
  /** Critics score from IMDb (0-10), when known. May also be read from `item`. */
  imdbRating?: number | null;
  /** Critics score from Rotten Tomatoes (0-10), when known. May also be read from `item`. */
  rtRating?: number | null;
  /** Optional explicit provider deep-links (name + url). When absent we try
   *  to derive one from `item.watchProviders` / `item.enrichment.watchProviders`. */
  providers?: { name: string; url: string }[];
  /** The viewer's own rating (0-10), carried separately from critic scores. */
  userRating?: number | null;
}

interface Props {
  cred: Credibility;
  /** The catalog item this strip frames — used to source critic scores and a
   *  provider deep-link when the credibility map itself doesn't carry them. */
  item?: CatalogItem;
  /** Optional page-scope user rating, used when `cred.userRating` is absent. */
  userRating?: number | null;
}

/** Threshold (on a 0-10 scale) above which IMDb vs RT disagreement is flagged. */
const DIVERGENCE_THRESHOLD = 1.5;

/** Best-effort read of a TMDB watch-providers link + first flatrate name. */
function readProviderLink(
  item?: CatalogItem,
): { name: string; url: string } | null {
  const wp =
    item?.enrichment?.watchProviders ??
    (item as { watchProviders?: unknown } | undefined)?.watchProviders;
  if (!wp || typeof wp !== "object") return null;
  const p = wp as { link?: string | null; flatrate?: { name?: string }[] };
  if (!p.link) return null;
  const first = p.flatrate?.[0]?.name;
  return { name: first ?? "Watch", url: p.link };
}

/**
 * F4 Credibility/source framing (design §13.4). Provenance strip for a title:
 * distributor, theatrical-vs-streaming, critics consensus, LLM stance tag —
 * and (D5 "critic deepen") IMDb≠RT divergence, the viewer's own rating
 * overlay, and a provider deep-link. Renders only the fields present
 * (graceful when data is sparse).
 */
export function CredibilityStrip({ cred, item, userRating }: Props) {
  const rows: { key: string; node: React.ReactNode }[] = [];

  if (cred.distributor) rows.push({ key: "dist", node: `Distributor: ${cred.distributor}` });
  if (cred.streaming != null) rows.push({ key: "stream", node: cred.streaming ? "Streaming" : "Theatrical" });
  if (cred.consensus) rows.push({ key: "consensus", node: cred.consensus });
  if (cred.stance) rows.push({ key: "stance", node: `Stance: ${cred.stance}` });

  // D5a — IMDb≠RT divergence hint.
  const imdb = cred.imdbRating ?? item?.imdbRating ?? null;
  const rt = cred.rtRating ?? item?.rtRating ?? null;
  if (imdb != null && rt != null && Math.abs(imdb - rt) > DIVERGENCE_THRESHOLD) {
    rows.push({
      key: "split",
      node: (
        <span className="text-amber-300/80">
          Critics split · IMDb {imdb} · RT {rt}
        </span>
      ),
    });
  }

  // D5b — viewer's own rating overlay.
  const you = cred.userRating ?? userRating ?? null;
  if (you != null) {
    rows.push({ key: "you", node: <span className="text-emerald-300/90">You: {you}/10</span> });
  }

  // D5c — provider deep-link (explicit list first, else derived from item).
  const providers = cred.providers && cred.providers.length ? cred.providers : [];
  const firstProvider = providers[0] ?? readProviderLink(item);
  if (firstProvider) {
    rows.push({
      key: "provider",
      node: (
        <a
          href={firstProvider.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-white/30 underline-offset-2 hover:text-white/80"
        >
          {firstProvider.name}
        </a>
      ),
    });
  }

  if (!rows.length) return null;
  return (
    <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
      {rows.map((r) => (
        <div key={r.key} className="rounded bg-white/[0.03] px-2 py-1">
          {r.node}
        </div>
      ))}
    </dl>
  );
}
