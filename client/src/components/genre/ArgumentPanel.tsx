export interface Counterpoint {
  title: string;
  relation: string;
}

interface Props {
  thesis: string;
  counterpoint?: Counterpoint | null;
}

/**
 * F3 "The Argument" (design §13.4). Per-title thesis + a counterpoint pointer
 * to a divergent neighbor. Graceful when only the thesis is present.
 */
export function ArgumentPanel({ thesis, counterpoint }: Props) {
  return (
    <section aria-label="The argument" className="rounded-2xl bg-white/[0.03] p-5">
      <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-white/50">
        The argument
      </h3>
      <p className="text-sm leading-relaxed text-white/80">{thesis}</p>
      {counterpoint && (
        <p className="mt-3 border-t border-white/10 pt-3 text-xs text-white/50">
          Counterpoint — <span className="text-white/70">{counterpoint.title}</span>: {counterpoint.relation}
        </p>
      )}
    </section>
  );
}
