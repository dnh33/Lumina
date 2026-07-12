import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, Loader2, Search, X } from "lucide-react";
import { api } from "../lib/api";
import { invalidateLibraryData } from "../lib/invalidate";
import { poster } from "../lib/img";
import { playCue } from "../lib/sound";
import type { CatalogItem, LibraryStatus } from "../lib/types";

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function ResultRow({ item }: { item: CatalogItem }) {
  const qc = useQueryClient();
  const [savedAs, setSavedAs] = useState<LibraryStatus | null>(null);
  const [failed, setFailed] = useState(false);
  const add = useMutation({
    mutationFn: (status: LibraryStatus) =>
      api.addToLibrary({ tmdbId: item.tmdbId, mediaType: item.mediaType, status }),
    onSuccess: (_e, status) => {
      playCue("success");
      setSavedAs(status);
      setFailed(false);
      invalidateLibraryData(qc);
    },
    onError: () => {
      setFailed(true);
      setTimeout(() => setFailed(false), 2500);
    },
  });
  const src = poster(item.posterPath, "w185");

  return (
    <div className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.04]">
      <div className="h-16 w-11 shrink-0 overflow-hidden rounded-md bg-ink-700 ring-1 ring-white/10">
        {src && <img src={src} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-mist-200">{item.title}</p>
        <p className="text-xs text-mist-400">
          {[item.year, item.mediaType === "tv" ? "Series" : "Film"]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      {failed ? (
        <span className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs font-semibold text-red-300">
          <AlertCircle className="h-3.5 w-3.5" /> Failed — retry
        </span>
      ) : savedAs || item.inLibrary ? (
        <span className="flex items-center gap-1.5 rounded-lg bg-gold-400/15 px-2.5 py-1.5 text-xs font-semibold text-gold-300">
          <Check className="h-3.5 w-3.5" />
          {savedAs === "watched" ? "Watched" : savedAs ? "Watchlist" : "In library"}
        </span>
      ) : add.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
      ) : (
        <div className="flex shrink-0 gap-1.5">
          {(["watched", "watchlist"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add.mutate(s)}
              className="rounded-lg bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-mist-300 ring-1 ring-white/10 transition hover:bg-gold-400 hover:text-ink-950"
            >
              {s === "watched" ? "Watched" : "Watchlist"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AddModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const debounced = useDebounced(q, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const results = useQuery({
    queryKey: ["tmdb-search", debounced],
    queryFn: () => api.search(debounced),
    enabled: debounced.trim().length >= 2,
  });

  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement as HTMLElement | null;
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQ("");
      openerRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // keep Tab inside the dialog while it's open
  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>(
      'button, input, [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink-950/70 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search titles to add"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-ink-850 ring-1 ring-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={trapTab}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5">
              <Search className="h-[18px] w-[18px] text-gold-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search films & series to add…"
                className="flex-1 bg-transparent text-[0.95rem] text-mist-200 placeholder-mist-400/80 outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="icon-btn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2">
              {results.isFetching && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-mist-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </div>
              )}
              {!results.isFetching && results.isError && (
                <p className="py-8 text-center text-sm text-red-300/90">
                  Search failed — {(results.error as Error).message}
                </p>
              )}
              {!results.isFetching && results.data?.length === 0 && (
                <p className="py-8 text-center text-sm text-mist-400">
                  Nothing found — try another spelling.
                </p>
              )}
              {!results.isFetching &&
                results.data?.map((item) => (
                  <ResultRow key={`${item.mediaType}${item.tmdbId}`} item={item} />
                ))}
              {!results.data && !results.isFetching && !results.isError && (
                <p className="py-8 text-center text-sm text-mist-400">
                  Type at least two characters.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
