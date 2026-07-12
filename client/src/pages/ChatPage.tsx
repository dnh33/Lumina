import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { History, MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { DOCK_CONVERSATION_KEY as DOCK_KEY } from "../lib/keys";
import { ChatThread } from "../components/chat/ChatThread";
import type { ConversationSummary } from "../lib/types";

function ConversationItem({
  c,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  c: ConversationSummary;
  active: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group relative cursor-pointer rounded-xl px-3.5 py-3 transition ${
        active
          ? "bg-gold-400/[0.1] ring-1 ring-gold-400/25"
          : "hover:bg-white/[0.04]"
      }`}
      onClick={onSelect}
    >
      <p
        className={`truncate pr-14 text-[0.85rem] font-medium ${active ? "text-gold-300" : "text-mist-200"}`}
      >
        {c.title}
      </p>
      {c.last_message && (
        <p className="mt-0.5 truncate pr-14 text-2xs text-mist-400">
          {c.last_message}
        </p>
      )}
      {/* actions: always reachable on touch, hover-revealed on desktop */}
      <div className="absolute right-2 top-2.5 flex gap-0.5 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:focus-within:opacity-100">
        <button
          type="button"
          title="Rename"
          aria-label={`Rename "${c.title}"`}
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className="icon-btn"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Delete"
          aria-label={`Delete "${c.title}"`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="icon-btn hover:bg-red-500/15 hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const conversationId = id ? Number(id) : null;
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const prefill = (location.state as { prefill?: string } | null)?.prefill;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: api.conversations,
  });

  // dock + full page share one "last active conversation"
  useEffect(() => {
    if (conversationId != null) {
      localStorage.setItem(DOCK_KEY, String(conversationId));
    }
  }, [conversationId]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const del = useMutation({
    mutationFn: (cid: number) => api.deleteConversation(cid),
    onSuccess: (_d, cid) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (localStorage.getItem(DOCK_KEY) === String(cid)) {
        localStorage.removeItem(DOCK_KEY);
      }
      if (cid === conversationId) navigate("/chat");
    },
  });
  const rename = useMutation({
    mutationFn: ({ cid, title }: { cid: number; title: string }) =>
      api.renameConversation(cid, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });

  const handleConversationChange = useCallback(
    (newId: number) => {
      navigate(`/chat/${newId}`, { replace: true, state: null });
      localStorage.setItem(DOCK_KEY, String(newId));
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    [navigate, qc],
  );

  const list = (onPick?: () => void) => (
    <>
      <button
        type="button"
        onClick={() => {
          navigate("/chat");
          onPick?.();
        }}
        className="btn-primary mb-3 w-full"
      >
        <MessageSquarePlus className="h-4 w-4" /> New conversation
      </button>
      <div className="panel min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {conversations.isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        {conversations.isError && (
          <div className="flex flex-col items-center gap-3 px-3 py-6 text-center">
            <p className="text-[0.8rem] text-mist-400">
              Couldn't load conversations.
            </p>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => conversations.refetch()}
            >
              Retry
            </button>
          </div>
        )}
        {conversations.data?.length === 0 && (
          <p className="px-3 py-6 text-center text-[0.8rem] text-mist-400">
            Every conversation is remembered — and searchable by the AI.
          </p>
        )}
        {conversations.data?.map((c) => (
          <ConversationItem
            key={c.id}
            c={c}
            active={c.id === conversationId}
            onSelect={() => {
              navigate(`/chat/${c.id}`);
              onPick?.();
            }}
            onRename={() => {
              const title = window.prompt("Rename conversation", c.title);
              if (title?.trim()) rename.mutate({ cid: c.id, title: title.trim() });
            }}
            onDelete={() => {
              if (window.confirm(`Delete "${c.title}"?`)) del.mutate(c.id);
            }}
          />
        ))}
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] gap-5 md:h-[calc(100dvh-4.5rem)]">
      {/* Desktop conversation list */}
      <aside className="hidden w-72 shrink-0 flex-col lg:flex">{list()}</aside>

      {/* Thread */}
      <div className="panel relative min-w-0 flex-1 overflow-hidden">
        {/* Mobile: conversation history trigger */}
        <button
          type="button"
          aria-label="Conversations"
          title="Conversations"
          onClick={() => setDrawerOpen(true)}
          className="absolute left-3 top-3 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-ink-800/90 text-mist-300 ring-1 ring-white/10 backdrop-blur transition hover:text-gold-300 lg:hidden"
        >
          <History className="h-[18px] w-[18px]" />
        </button>

        <ChatThread
          conversationId={conversationId}
          onConversationChange={handleConversationChange}
          prefill={prefill}
          dormant={false}
        />
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm lg:hidden"
            onClick={() => setDrawerOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Conversations"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-full w-[280px] flex-col bg-ink-900 p-3 pt-4 ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="font-display text-lg font-semibold text-mist-200">
                  Conversations
                </p>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setDrawerOpen(false)}
                  className="icon-btn"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {list(() => setDrawerOpen(false))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
