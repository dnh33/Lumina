import { useSyncExternalStore } from "react";
import { bind, play, setEnabled, type SoundName } from "cuelume";
import { SOUND_KEY } from "./keys";

/**
 * Single owner of the Cuelume surface — nothing else imports "cuelume"
 * directly (except the sanity test). Owns the mute policy:
 *
 *   effective = userPref && !prefersReducedMotion
 *
 * Cuelume's setEnabled is a module global with no persistence and no
 * reduced-motion awareness; both live here, at module level, because the
 * thing they drive is global too.
 */

let userPref = true;
let reducedMotion = false;
let initialized = false;
const listeners = new Set<() => void>();

function loadPref(): boolean {
  const raw = localStorage.getItem(SOUND_KEY);
  return raw === null ? false : raw === "1"; // off by default (local-first: no surprise audio)
}

function applyPolicy() {
  setEnabled(userPref && !reducedMotion);
}

/** Called once at app mount. bind() is idempotent, and so is this. */
export function initSound() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  bind();
  userPref = loadPref();
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotion = mq.matches;
  mq.addEventListener("change", (e) => {
    reducedMotion = e.matches;
    applyPolicy();
  });
  applyPolicy();
}

function setPref(next: boolean) {
  userPref = next;
  localStorage.setItem(SOUND_KEY, next ? "1" : "0");
  applyPolicy();
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** React view of the user preference (not the effective mute state). */
export function useSound(): {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
} {
  const enabled = useSyncExternalStore(subscribe, () => userPref);
  return { enabled, setEnabled: setPref };
}

/**
 * Reads the user's persisted sound preference. Returns false when SOUND_KEY
 * is unset (the new default — no surprise audio on a fresh visit) and true
 * only when the user has explicitly opted in (SOUND_KEY === "1").
 *
 * This is the gate for unmediated, gesture-free cues (e.g. the world "open"
 * beat fired on page mount). It honors local-first intent: a visitor hears
 * nothing until they enable sound. Reduced-motion is layered on separately by
 * applyPolicy()/cuelume's setEnabled, so callers need only check this.
 */
export function getSoundEnabled(): boolean {
  return loadPref();
}

/**
 * The one choke point for imperative cues. play() is SSR-safe and no-ops
 * when muted or given an unknown name.
 */
export function playCue(name: SoundName) {
  play(name);
}
