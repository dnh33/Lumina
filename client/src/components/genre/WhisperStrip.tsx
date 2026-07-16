import { useMemo } from "react";

interface Props {
  /** Decade bucket (e.g. 2010 → "2010s"). null = all eras. */
  decade: number | null;
  /** Number of anchor titles used to seed the world. */
  anchorCount: number;
  /** Number of titles the user hasn't watched yet. */
  unwatched: number;
}

/**
 * WhisperStrip (C5, deterministic): a SHORT, template-built phrase summarizing
 * the current filter state. Deliberately NOT routed through the Companion LLM —
 * the string is a pure function of the props so it is stable and cheap.
 */
export function WhisperStrip({ decade, anchorCount, unwatched }: Props) {
  const phrase = useMemo(() => {
    const era = decade == null ? "every era" : `${decade}s`;
    const anchors =
      anchorCount === 0 ? "no anchors" : `${anchorCount} anchor${anchorCount === 1 ? "" : "s"}`;
    const unwatchedWord =
      unwatched === 0 ? "all watched" : `${unwatched} unwatched`;
    return `Your ${era} leans open — ${anchors}, ${unwatchedWord}.`;
  }, [decade, anchorCount, unwatched]);

  return (
    <p
      data-testid="whisper-strip"
      className="text-xs text-white/40"
    >
      {phrase}
    </p>
  );
}
