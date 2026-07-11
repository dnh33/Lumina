import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Maximize2, Sparkles, X } from "lucide-react";
import { ChatThread } from "./ChatThread";

const DOCK_KEY = "lumina-dock-conversation";

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

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-4 z-50 flex h-[min(620px,72vh)] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-ink-850/95 ring-1 ring-white/12 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl md:bottom-8 md:right-8"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-400" />
                <span className="font-display text-[0.95rem] font-semibold text-mist-200">
                  Lumina
                </span>
                <span className="rounded-full bg-gold-400/10 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider text-gold-300/90">
                  knows your taste
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Open full screen"
                  onClick={() => {
                    setOpen(false);
                    navigate(conversationId ? `/chat/${conversationId}` : "/chat");
                  }}
                  className="rounded-lg p-1.5 text-mist-400 transition hover:bg-white/[0.06] hover:text-mist-200"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Close"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1.5 text-mist-400 transition hover:bg-white/[0.06] hover:text-mist-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <ChatThread
              compact
              conversationId={conversationId}
              onConversationChange={handleConversationChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        title="Talk to Lumina"
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300 to-gold-500 text-ink-950 shadow-[0_10px_36px_-6px_rgba(232,184,75,0.55)] md:bottom-8 md:right-8"
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
