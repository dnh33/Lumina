import { useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import { api } from "../lib/api";
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
        className={`truncate pr-12 text-[0.85rem] font-medium ${active ? "text-gold-300" : "text-mist-200"}`}
      >
        {c.title}
      </p>
      {c.last_message && (
        <p className="mt-0.5 truncate pr-6 text-[0.72rem] text-mist-400">
          {c.last_message}
        </p>
      )}
      <div className="absolute right-2 top-2.5 hidden gap-0.5 group-hover:flex">
        <button
          type="button"
          title="Rename"
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          className="rounded-md p-1 text-mist-400 transition hover:bg-white/[0.08] hover:text-mist-200"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-md p-1 text-mist-400 transition hover:bg-red-500/15 hover:text-red-300"
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

  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: api.conversations,
  });

  const del = useMutation({
    mutationFn: (cid: number) => api.deleteConversation(cid),
    onSuccess: (_d, cid) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
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
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    [navigate, qc],
  );

  return (
    <div className="flex h-[calc(100vh-8.5rem)] gap-5 md:h-[calc(100vh-4.5rem)]">
      {/* Conversation list */}
      <aside className="hidden w-72 shrink-0 flex-col lg:flex">
        <button
          type="button"
          onClick={() => navigate("/chat")}
          className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
        >
          <MessageSquarePlus className="h-4 w-4" /> New conversation
        </button>
        <div className="panel min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
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
              onSelect={() => navigate(`/chat/${c.id}`)}
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
      </aside>

      {/* Thread */}
      <div className="panel min-w-0 flex-1 overflow-hidden">
        <ChatThread
          conversationId={conversationId}
          onConversationChange={handleConversationChange}
          prefill={prefill}
        />
      </div>
    </div>
  );
}
