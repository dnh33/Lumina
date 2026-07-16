import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle, Sparkles, X } from "lucide-react";
import { ChatThread } from "../chat/ChatThread";
import { GENRE_DOCK_CONVERSATION_KEY } from "../../lib/keys";
import type { GenreWorld } from "../../lib/genreWorld";
import type { Suggestion } from "../chat/SuggestionCards";

/** Read the numeric genre conversation id from the dedicated, constant
 *  localStorage key. NaN / missing → null (a fresh companion). */
function readGenreConversationId(): number | null {
  const raw = localStorage.getItem(GENRE_DOCK_CONVERSATION_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
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

/**
 * Ambient in-world Companion (Task 4.3, B2).
 *
 * A compact, collapsible chat docked on /genre that speaks the world's
 * register (lexicon + tonePrompt) via the diegetic `prefill` and
 * `welcomeSuggestions` — NOT a system prompt (useChat has none). Its
 * conversation is keyed under `GENRE_DOCK_CONVERSATION_KEY`, which is:
 *   - DISTINCT from the global `DOCK_CONVERSATION_KEY`, so it never collides
 *     with / clobbers the user's main ChatDock, and
 *   - CONSTANT (slug-independent), so navigating /genre/a → /genre/b keeps the
 *     same conversation — the in-flight stream is not aborted on slug remount.
 *
 * The global ChatDock is hidden on /genre by App.tsx, so this is the only dock
 * on the page and there is no double-dock.
 */
export function CompanionPanel({ world }: { world: GenreWorld }) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(() =>
    readGenreConversationId(),
  );

  const handleConversationChange = (id: number) => {
    setConversationId(id);
    localStorage.setItem(GENRE_DOCK_CONVERSATION_KEY, String(id));
  };

  // Stay in sync if the conversation id is written elsewhere (e.g. a send that
  // creates a brand-new conversation via useChat). On open we re-read in case
  // it changed between renders.
  useEffect(() => {
    if (!open) return;
    setConversationId(readGenreConversationId());
  }, [open]);

  const prefill = `Take me deeper into the ${world.slug} world — what should I watch next and why?`;
  const suggestions = welcomeFor(world);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-label={`${world.slug} companion`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-[min(560px,68dvh)] w-[min(380px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl bg-ink-850/95 ring-1 ring-white/10 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl md:bottom-8 md:right-8"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-400" />
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
                onClick={() => setOpen(false)}
                className="icon-btn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ChatThread
              compact
              prefill={prefill}
              welcomeSuggestions={suggestions}
              conversationId={conversationId}
              onConversationChange={handleConversationChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={reduceMotion ? undefined : { scale: 1.06 }}
        whileTap={reduceMotion ? undefined : { scale: 0.94 }}
        aria-label={open ? `Close the ${world.slug} companion` : `Talk to the ${world.slug} companion`}
        aria-expanded={open}
        title="Talk to the in-world companion"
        className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300/90 to-gold-500/90 text-ink-950 shadow-[0_10px_36px_-6px_rgba(232,184,75,0.5)] md:bottom-6 md:right-8"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </motion.button>
    </>
  );
}
