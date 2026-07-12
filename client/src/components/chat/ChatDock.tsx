import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Maximize2, MessageSquarePlus, Sparkles, X } from "lucide-react";
import { api } from "../../lib/api";
import { playCue } from "../../lib/sound";
import { ChatThread } from "./ChatThread";
import { DOCK_CONVERSATION_KEY as DOCK_KEY } from "../../lib/keys";

export function ChatDock() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(() => {
    const raw = localStorage.getItem(DOCK_KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  });
  const navigate = useNavigate();

  const handleConversationChange = (id: number) => {
    setConversationId(id);
    localStorage.setItem(DOCK_KEY, String(id));
  };

  useEffect(() => {
    if (!open) return;
    // stay in sync with the full page's last-active conversation
    const raw = localStorage.getItem(DOCK_KEY);
    const n = raw ? Number(raw) : NaN;
    setConversationId(Number.isFinite(n) ? n : null);

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // R15 — scroll-reactive dock compression. The scroll container lives inside
  // ChatThread (its overflow-y-auto body); we own the ref here and pass it down
  // so useScroll watches the real scroller. As it scrolls down the dock
  // compresses to ~0.92 scale (transform only) via a damped spring, easing back
  // at the top. GPU-only (scale / opacity).
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const dockScaleRaw = useSpring(scrollY, { stiffness: 200, damping: 30 });
  const dockScale = useTransform(dockScaleRaw, [0, 320], [1, 0.92], { clamp: true });
  const dockOpacity = useTransform(dockScaleRaw, [0, 320], [1, 0.92], { clamp: true });

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="false"
            aria-label="Lumina chat"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-[min(620px,72dvh)] w-[min(430px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl bg-ink-850/95 ring-1 ring-white/10 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl md:bottom-8 md:right-8"
          >
            {/* R15 — scroll-reactive dock compression: the body scales to ~0.92
                and dims slightly as the conversation scrolls down (transform /
                opacity only), then eases back at the top. Kept on an inner
                wrapper so it never fights the dialog's enter/exit animation. */}
            <motion.div
              style={{ scale: dockScale, opacity: dockOpacity }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-400" />
                <span className="font-display text-[0.95rem] font-semibold text-mist-200">
                  Lumina
                </span>
                <span className="rounded-full bg-gold-400/10 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-gold-300/90">
                  knows your taste
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="New conversation"
                  aria-label="Start a new conversation"
                  onClick={async () => {
                    const created = await api.createConversation();
                    playCue("droplet");
                    handleConversationChange(created.id);
                  }}
                  className="icon-btn"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Open full screen"
                  aria-label="Open full screen chat"
                  onClick={() => {
                    setOpen(false);
                    navigate(conversationId ? `/chat/${conversationId}` : "/chat");
                  }}
                  className="icon-btn"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Close"
                  aria-label="Close chat"
                  onClick={() => setOpen(false)}
                  className="icon-btn"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <ChatThread
              compact
              conversationId={conversationId}
              onConversationChange={handleConversationChange}
              scrollRef={scrollRef}
            />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-cuelume-hover="whisper"
        data-cuelume-toggle="toggle"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? "Close Lumina chat" : "Talk to Lumina"}
        aria-expanded={open}
        title="Talk to Lumina"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 text-ink-950 shadow-[0_10px_36px_-6px_rgba(232,184,75,0.55)] md:bottom-8 md:right-8"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <svg viewBox="0 0 100 100" className="h-7 w-7" aria-hidden>
            <path
              d="M50 8 L58 38 L88 46 L58 54 L50 88 L42 54 L12 46 L42 38 Z"
              fill="currentColor"
            />
          </svg>
        )}
      </motion.button>
    </>
  );
}
