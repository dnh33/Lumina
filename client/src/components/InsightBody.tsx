import { Link } from "react-router-dom";
import { RefreshCw, Sparkles } from "lucide-react";
import type { InsightRelation, TitleInsight } from "../lib/types";

const VERDICT: Record<
  TitleInsight["verdict"],
  { label: string; cls: string }
> = {
  love: {
    label: "Love",
    cls: "bg-emerald-400/[0.14] text-emerald-300 ring-emerald-400/30",
  },
  maybe: {
    label: "Maybe",
    cls: "bg-gold-400/[0.14] text-gold-300 ring-gold-400/30",
  },
  skip: {
    label: "Skip",
    cls: "bg-red-400/[0.14] text-red-300 ring-red-400/30",
  },
  rewatch: {
    label: "Rewatch",
    cls: "bg-violet-400/[0.14] text-violet-300 ring-violet-400/30",
  },
};

const RELATION: Record<InsightRelation, { label: string; cls: string }> = {
  echoes: {
    label: "echoes",
    cls: "bg-emerald-400/[0.12] text-emerald-300 ring-emerald-400/25",
  },
  warns: {
    label: "warns",
    cls: "bg-red-400/[0.12] text-red-300 ring-red-400/25",
  },
  diverges: {
    label: "diverges",
    cls: "bg-gold-400/[0.12] text-gold-300 ring-gold-400/25",
  },
};

export function InsightBody({
  insight,
  onRegenerate,
  onFollowup,
}: {
  insight: TitleInsight;
  onRegenerate: () => void;
  onFollowup: (prefill: string) => void;
}) {
  const verdict = VERDICT[insight.verdict] ?? VERDICT.maybe;

  return (
    <div className="flex flex-col gap-4">
      {/* verdict + score header */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-2xs font-semibold uppercase tracking-wider ring-1 ${verdict.cls}`}
        >
          {verdict.label}
        </span>
        {insight.matchScore != null && (
          <span className="tabular-nums text-2xs font-medium text-gold-300">
            Match {insight.matchScore}
          </span>
        )}
        {insight.cached && (
          <span className="text-2xs text-mist-500">· cached</span>
        )}
        <button
          type="button"
          aria-label="Regenerate insight"
          title="Regenerate"
          onClick={onRegenerate}
          className="icon-btn ml-auto"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* capped, scrollable prose — never overflows the rail */}
      <p className="max-h-[260px] overflow-y-auto pr-1 font-display text-[1.02rem] leading-relaxed text-mist-200">
        {insight.text}
      </p>

      {/* comparison anchors → their own titles */}
      {insight.comparisons?.length > 0 && (
        <div className="space-y-1.5">
          {insight.comparisons.map((c) => {
            const rel = RELATION[c.relation] ?? RELATION.echoes;
            return (
              <Link
                key={c.tmdbId}
                to={`/title/${c.mediaType}/${c.tmdbId}`}
                className="group flex items-start justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/[0.08] transition hover:ring-gold-400/40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-mist-200 transition group-hover:text-gold-300">
                    {c.title}
                    {c.year ? (
                      <span className="text-mist-400"> ({c.year})</span>
                    ) : null}
                  </span>
                  {c.note && (
                    <span className="mt-0.5 block text-2xs leading-snug text-mist-400">
                      {c.note}
                    </span>
                  )}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider ring-1 ${rel.cls}`}
                >
                  {rel.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      {/* hook */}
      {insight.hook && (
        <p className="flex items-start gap-2 text-sm italic leading-relaxed text-mist-300">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
          <span>{insight.hook}</span>
        </p>
      )}

      {/* follow-up deep-links into chat */}
      {insight.followups?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {insight.followups.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => onFollowup(f.prefill)}
              className="btn-ghost px-3 py-1.5 text-2xs"
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
