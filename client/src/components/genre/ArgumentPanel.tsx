import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { stripInlineMarkdown, normalizeInsightThesis } from "../../lib/insightThesis.js";

export interface Counterpoint {
  title: string;
  relation: string;
  /** Optional until Task 1.4 lands; defense-in-depth link target. */
  tmdbId?: number;
  mediaType?: "movie" | "tv";
}

export type ComparisonRelation =
  | "for"
  | "against"
  | "neutral"
  | (string & {});

export interface Comparison {
  title: string;
  relation: ComparisonRelation;
  /** Optional until Task 1.4 lands; defense-in-depth link target. */
  tmdbId?: number;
  mediaType?: "movie" | "tv";
}

interface Props {
  thesis: string;
  /** Legacy single-counterpoint pointer (P2.2). Still supported. */
  counterpoint?: Counterpoint | null;
  /** New: multiple pro/con/neutral comparisons (Task 6.1 / D2). */
  comparisons?: Comparison[];
  /** Optional tmdbId used to key the per-title user annotation in localStorage. */
  tmdbId?: number;
}

const RELATION_LABEL: Record<string, string> = {
  for: "For",
  against: "Against",
  neutral: "Neutral",
};

function relationLabel(relation: ComparisonRelation): string {
  const known = RELATION_LABEL[relation as string];
  if (known) return known;
  const r = String(relation);
  return r ? r.charAt(0).toUpperCase() + r.slice(1) : r;
}

/**
 * F3 "The Argument" (design §13.4). Per-title thesis + counterpoint pointers
 * to divergent neighbors. Supports both the legacy single `counterpoint` and
 * the new multi-comparison `comparisons` array; renders whichever is present
 * (preferring `comparisons`). Graceful when only the thesis is present.
 *
 * A local user annotation (one note per title, keyed by tmdbId) is persisted
 * to localStorage and reloaded on remount (Task 6.1 / D2).
 */
export function ArgumentPanel({ thesis, counterpoint, comparisons, tmdbId }: Props) {
  // Prefer the new multi-comparison shape; fall back to the legacy single
  // counterpoint. Treat an empty comparisons array as "absent".
  const rows: Comparison[] =
    comparisons && comparisons.length > 0
      ? comparisons
      : counterpoint
        ? [counterpoint]
        : [];

  const annotationKey =
    tmdbId != null ? `lumina:arg-annotation:${tmdbId}` : null;

  const [annotation, setAnnotation] = useState<string>(() => {
    if (!annotationKey) return "";
    try {
      return localStorage.getItem(annotationKey) ?? "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    if (!annotationKey) return;
    try {
      if (annotation) localStorage.setItem(annotationKey, annotation);
      else localStorage.removeItem(annotationKey);
    } catch {
      /* localStorage unavailable (private mode / quota) — degrade silently. */
    }
  }, [annotation, annotationKey]);

  const annotationId = useId();
  const safeThesis =
    normalizeInsightThesis(thesis) ??
    (typeof thesis === "string" && thesis.trim() && !thesis.trim().startsWith("{")
      ? stripInlineMarkdown(thesis)
      : "Thesis unavailable for this title — try another pick from the timeline.");

  return (
    <section aria-label="The argument" className="rounded-2xl bg-white/[0.03] p-5">
      <h3 className="text-xs tracking-tight text-mist-300">The argument</h3>
      <p className="text-sm leading-relaxed text-white/80">{safeThesis}</p>

      {rows.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-white/10 pt-3">
          {rows.map((c, i) => (
            <li key={i} className="text-xs text-white/50">
              <span className="mr-1 font-medium text-white/70">
                {relationLabel(c.relation)}
              </span>
              {c.tmdbId != null && c.mediaType ? (
                <Link
                  to={`/title/${c.mediaType}/${c.tmdbId}`}
                  className="text-white/70 hover:text-white/90"
                >
                  {c.title}
                </Link>
              ) : (
                <span className="text-white/70">{c.title}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {annotationKey && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <label
            htmlFor={annotationId}
            className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50"
          >
            Your note
          </label>
          <textarea
            id={annotationId}
            value={annotation}
            onChange={(e) => setAnnotation(e.target.value)}
            placeholder="Add a note about this title…"
            rows={2}
            className="w-full resize-y rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>
      )}
    </section>
  );
}
