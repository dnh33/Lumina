import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { ChatThread } from "../chat/ChatThread";
import { genreCompanionConversationKey } from "../../lib/keys";
import { api } from "../../lib/api";
import { accentVar } from "../../lib/metaphor";
import type { GenreWorld } from "../../lib/genreWorld";
import type { Suggestion } from "../chat/SuggestionCards";

const FOCUSABLE_SEL =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

function focusablesIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SEL)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
  );
}

/** Read a numeric conversation id from a localStorage key. NaN / missing → null. */
function readConversationId(key: string): number | null {
  const raw = localStorage.getItem(key);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

interface TourDialChip {
  id: string;
  label: string;
}

function welcomeFor(world: GenreWorld): Suggestion[] {
  const [first, second] = world.register.lexicon;
  return [
    {
      title: `Show me something ${first ?? "worth watching"}`,
      subtitle: `in the ${world.slug} world`,
    },
    {
      title: `What defines the ${world.metaphor} here?`,
      subtitle: "the world's shape",
    },
    ...(second
      ? [
          {
            title: `Where does ${second} show up next?`,
            subtitle: "go deeper",
          } as Suggestion,
        ]
      : []),
  ];
}

/** Shelf-bound deepen prompts — narrate tonight, not invent a fourth novel. */
function deepenSuggestions(world: GenreWorld, dials: TourDialChip[]): Suggestion[] {
  const dialHint =
    dials.length > 0
      ? dials.map((d) => d.label).slice(0, 2).join(" · ")
      : "tonight's dials";
  return [
    {
      title: "Defend tonight's three",
      subtitle: "shelf-bound",
    },
    {
      title: `Which of these fits ${dialHint}?`,
      subtitle: `${world.metaphor} tour`,
    },
  ];
}

/**
 * Ambient in-world Companion (Task 4.3, B2).
 *
 * A compact, collapsible chat docked on /genre that speaks the world's
 * register (lexicon + tonePrompt) via the diegetic `prefill` and
 * `welcomeSuggestions` — NOT a system prompt (useChat has none). Its
 * conversation is keyed via `genreCompanionConversationKey`:
 *   - DISTINCT from the global `DOCK_CONVERSATION_KEY`, so it never collides
 *     with / clobbers the user's main ChatDock.
 *   - Self: shared constant across genres (hop without aborting the thread).
 *   - Guided: per-world key so tour chats don't bleed across genres; also
 *     linked into the guided-session blob via `linkGuided`.
 *
 * Guided mode packs as a DEEPEN HUD detail pane (GTA-browser density):
 * constrained height, quieter chrome, tour dials visible — not a second
 * scrolling novel over the claim cockpit.
 *
 * The global ChatDock is hidden on /genre by App.tsx, so this is the only dock
 * on the page and there is no double-dock.
 */
export function CompanionPanel({
  world,
  guided = false,
  mediaType = "movie",
  tourCue = null,
  onOpenChange,
}: {
  world: GenreWorld;
  /** When true, pull guided-session answers into the companion prefill. */
  guided?: boolean;
  mediaType?: "movie" | "tv";
  /** Live Whisper/outcome cue from GuidedTour — shown in the DEEPEN strip. */
  tourCue?: string | null;
  /** Report FAB/panel open so Guided can derive deepen stage. */
  onOpenChange?: (open: boolean) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const storageKey = genreCompanionConversationKey(world.slug, mediaType, guided);
  const [conversationId, setConversationId] = useState<number | null>(() =>
    readConversationId(storageKey),
  );
  const [guidedPrefill, setGuidedPrefill] = useState<string | null>(null);
  const [tourDials, setTourDials] = useState<TourDialChip[]>([]);

  const closePanel = () => setOpen(false);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // W2.8: guided deepen = modal keyboard contract (rail geometry unchanged).
  useEffect(() => {
    if (!open || !guided) return;
    const t = window.setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, guided]);

  useEffect(() => {
    if (!open || !guided) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, guided]);

  useEffect(() => {
    if (!open || !guided) return;
    return () => {
      // Restore to FAB after unmount (AnimatePresence exit still has panel briefly).
      window.setTimeout(() => fabRef.current?.focus(), 0);
    };
  }, [open, guided]);

  const trapTab = (e: ReactKeyboardEvent) => {
    if (!guided || e.key !== "Tab" || !panelRef.current) return;
    const nodes = focusablesIn(panelRef.current);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleConversationChange = async (id: number) => {
    setConversationId(id);
    localStorage.setItem(storageKey, String(id));
    // Await link so the first chat turn already sees guided RAG context.
    if (guided) {
      try {
        await api.linkGuided({
          slug: world.slug,
          mediaType,
          conversationId: id,
        });
      } catch {
        /* best-effort */
      }
    }
  };

  // Swap conversation when world / mode / mediaType changes the storage key.
  useEffect(() => {
    setConversationId(readConversationId(storageKey));
  }, [storageKey]);

  // Stay in sync if the conversation id is written elsewhere (e.g. a send that
  // creates a brand-new conversation via useChat). On open we re-read in case
  // it changed between renders.
  useEffect(() => {
    if (!open) return;
    setConversationId(readConversationId(storageKey));
  }, [open, storageKey]);

  // Re-link when opening an existing conversation in guided mode.
  useEffect(() => {
    if (!guided || !open || conversationId == null) return;
    void api
      .linkGuided({
        slug: world.slug,
        mediaType,
        conversationId,
      })
      .catch(() => {
        /* link is best-effort; chat still works without injection */
      });
  }, [guided, open, conversationId, world.slug, mediaType]);

  // Guided: prefill from tour answers; hydrate conversationId from session
  // blob when this world's LS key is empty (e.g. new device / cleared key).
  useEffect(() => {
    if (!guided || !open) {
      setGuidedPrefill(null);
      setTourDials([]);
      return;
    }
    let cancelled = false;
    void api.guidedSession(world.slug, mediaType).then((payload) => {
      if (cancelled) return;
      const linked = payload.session.conversationId;
      if (
        readConversationId(storageKey) == null &&
        linked != null &&
        Number.isFinite(linked) &&
        linked > 0
      ) {
        setConversationId(linked);
        localStorage.setItem(storageKey, String(linked));
      }
      const dials: TourDialChip[] = [];
      const parts: string[] = [];
      for (const beat of payload.beats) {
        const choiceId = payload.session.answers[beat.id];
        if (!choiceId) continue;
        const choice = beat.choices.find((c) => c.id === choiceId);
        if (!choice) continue;
        dials.push({ id: beat.id, label: choice.label });
        parts.push(`${beat.id}: ${choice.label}`);
      }
      setTourDials(dials);
      setGuidedPrefill(
        parts.length
          ? `I'm mid-tour in the ${world.slug} world. My choices so far: ${parts.join("; ")}. Defend tonight's shelf three — which fits and why.`
          : `I'm touring the ${world.slug} world in Guided mode. Help me claim tonight's shelf — defend the three, don't invent a fourth.`,
      );
    }).catch(() => {
      if (!cancelled) {
        setGuidedPrefill(null);
        setTourDials([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [guided, open, world.slug, mediaType, storageKey]);

  const prefill =
    guidedPrefill ??
    `Take me deeper into the ${world.slug} world - what should I watch next and why?`;
  const suggestions = guided
    ? deepenSuggestions(world, tourDials)
    : welcomeFor(world);

  const panelClass = guided
    ? // DEEPEN rail: right column; Tonight shelf cleared via body:has padding (theme.css)
      "companion-deepen-rail fixed top-[max(4.5rem,env(safe-area-inset-top))] bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-40 flex w-[min(320px,calc(100vw-1.5rem))] origin-bottom-right flex-col overflow-hidden overscroll-contain rounded-2xl bg-ink-850/97 ring-1 ring-white/[0.08] shadow-[0_16px_48px_-16px_rgba(0,0,0,0.75)] backdrop-blur-xl md:right-7"
    : "fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-[min(560px,68dvh)] w-[min(380px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl bg-ink-850/95 ring-1 ring-white/10 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl md:bottom-8 md:right-8";

  // Lacquer face + world-accent edge (theme `.companion-fab`). Gold glow only
  // when live — never a solid gold brick fighting in-world verbs (Watchlist).
  const fabClass = guided
    ? "companion-fab fixed bottom-[calc(3.25rem+env(safe-area-inset-bottom))] right-3 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl md:bottom-5 md:right-7"
    : "companion-fab fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl md:bottom-6 md:right-8";

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal={guided ? "true" : "false"}
            aria-label={
              guided
                ? `${world.slug} deepen companion`
                : `${world.slug} companion`
            }
            data-companion-mode={guided ? "guided-deepen" : "self"}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={panelClass}
            onKeyDown={trapTab}
          >
            {guided ? (
              <header className="shrink-0 border-b border-white/[0.06]">
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-[0.88rem] font-semibold leading-none text-mist-100">
                        Deepen
                      </span>
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-gold-400/85">
                        tour
                      </span>
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[0.62rem] text-mist-300">
                      {world.metaphor} · shelf-bound
                    </p>
                  </div>
                  <button
                    ref={closeBtnRef}
                    type="button"
                    title="Close companion"
                    aria-label="Close companion"
                    onClick={closePanel}
                    className="icon-btn shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {(tourDials.length > 0 || tourCue) && (
                  <div
                    data-testid="companion-tour-context"
                    className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.04] bg-black/20 px-3 py-1.5"
                  >
                    {tourDials.map((d) => (
                      <span
                        key={d.id}
                        className="max-w-[9rem] truncate rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wide text-mist-300"
                        title={`${d.id}: ${d.label}`}
                      >
                        {d.label}
                      </span>
                    ))}
                    {tourDials.length === 0 && (
                      <span className="font-mono text-[0.58rem] uppercase tracking-wide text-mist-300">
                        dials open
                      </span>
                    )}
                    {tourCue && (
                      <span
                        className="ml-auto max-w-[55%] truncate font-mono text-[0.58rem] text-gold-300/80"
                        title={tourCue}
                      >
                        {tourCue}
                      </span>
                    )}
                  </div>
                )}
              </header>
            ) : (
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(232,184,75,0.55)]"
                  />
                  <span className="font-display text-[0.95rem] font-semibold text-mist-200">
                    {world.metaphor} Companion
                  </span>
                  <span className="rounded-full bg-gold-400/10 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-gold-300/90">
                    in-world
                  </span>
                </div>
                <button
                  type="button"
                  title="Close companion"
                  aria-label="Close companion"
                  onClick={closePanel}
                  className="icon-btn"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1">
              <ChatThread
                compact
                prefill={prefill}
                welcomeSuggestions={suggestions}
                conversationId={conversationId}
                onConversationChange={handleConversationChange}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={
          open
            ? `Close the ${world.slug} companion`
            : guided
              ? `Deepen with the ${world.slug} companion`
              : `Talk to the ${world.slug} companion`
        }
        aria-expanded={open}
        title={
          guided
            ? "Deepen tonight's shelf"
            : "Talk to the in-world companion"
        }
        data-companion-fab={guided ? "guided" : "self"}
        style={{ ["--world-accent" as any]: accentVar(world) }}
        className={fabClass}
      >
        {open ? (
          <X className={guided ? "h-4 w-4" : "h-5 w-5"} />
        ) : (
          <MessageCircle className={guided ? "h-4 w-4" : "h-5 w-5"} />
        )}
      </motion.button>
    </>
  );
}
