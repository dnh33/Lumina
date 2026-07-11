import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

/* ── Skeletons ───────────────────────────────────────────────────── */

export function PosterSkeletonRow({ count = 7 }: { count?: number }) {
  return (
    <div className="no-scrollbar -mx-1 mb-10 flex gap-4 overflow-hidden px-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[138px] shrink-0 sm:w-[152px] lg:w-[168px]">
          <div className="skeleton aspect-[2/3]" />
          <div className="skeleton mt-2 h-3.5 w-3/4 rounded-md" />
          <div className="skeleton mt-1.5 h-3 w-1/2 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return <div className="skeleton mb-12 h-[420px] w-full rounded-3xl" />;
}

/* ── Empty state ─────────────────────────────────────────────────── */

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="panel mx-auto my-14 flex max-w-lg flex-col items-center px-8 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/10 ring-1 ring-gold-400/25">
        <Sparkles className="h-6 w-6 text-gold-400" />
      </div>
      <h3 className="font-display text-xl font-semibold text-mist-200">{title}</h3>
      {children && (
        <p className="mt-2 text-sm leading-relaxed text-mist-400">{children}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ── Rating dial (1–10) ──────────────────────────────────────────── */

export function RatingDial({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = value != null && n <= value;
        return (
          <button
            key={n}
            type="button"
            aria-label={`Rate ${n}/10`}
            onClick={() => onChange(value === n ? null : n)}
            className={`h-7 w-7 rounded-lg text-[0.72rem] font-bold transition-all duration-150 ${
              active
                ? "bg-gold-400 text-ink-950 shadow-[0_0_14px_rgba(232,184,75,0.35)]"
                : "bg-white/[0.05] text-mist-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-mist-200"
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

/* ── Small labeled chip ──────────────────────────────────────────── */

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.72rem] font-medium text-mist-300 ring-1 ring-white/10">
      {children}
    </span>
  );
}
