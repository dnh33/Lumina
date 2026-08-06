/**
 * Claim-as-home widen policy (claim-loop T3).
 * Completed Guided always paints Claim first. Sticky browse collapses on
 * Guided enter/remount unless the user explicitly clicked Widen this visit.
 */

/** Keep widen only when Widen CTA fired during this Guided visit. */
export function resolveGuidedWidenOnClaimHome(args: {
  widenIntentThisSession: boolean;
}): boolean {
  return args.widenIntentThisSession;
}

/** Mode flip Self↔Guided never carries browse across the seam. */
export function clearWidenOnModeFlip(): {
  guidedWiden: boolean;
  widenIntent: boolean;
} {
  return { guidedWiden: false, widenIntent: false };
}
