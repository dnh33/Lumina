import type { Variants } from "framer-motion";

/**
 * Signature easings (P13 / motion recipes).
 * EASE_OUT_EXPO — entrances (per plan + design: cubic-bezier(0.22,1,0.36,1)).
 * EASE_STATE    — state changes (cubic-bezier(0.4,0,0.2,1)).
 * Also mirrored as CSS custom props in theme.css (--ease-out-expo / --ease-state).
 */
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
export const EASE_STATE = [0.4, 0, 0.2, 1] as const;

/** R1 — Message enter (slide + fade, spring). */
export const messageEnter: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 30, mass: 0.9 },
  },
};

/** R2 — Message exit (lift-away). */
export const messageExit: Variants = {
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: EASE_STATE },
  },
};

/** R4 — Stagger container (60ms baseline, 40ms initial delay). */
export const stagger60: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

/** R11 — Suggestion "dealing in" posters: tilt + rise with spring. */
export const posterDeal: Variants = {
  hidden: { opacity: 0, y: 24, rotateX: -12 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};
