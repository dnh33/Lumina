import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Search, X } from "lucide-react";
import { api } from "../lib/api";
import { poster } from "../lib/img";
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
  const [savedAs, setSavedAs] = useState<LibraryStatus | null>(
    item.inLibrary ? "watched" : null,
  );
  const add = useMutation({
    mutationFn: (status: LibraryStatus) =>
      api.addToLibrary({ tmdbId: item.tmdbId, mediaType: item.mediaType, status }),
    onSuccess: (_e, status) => {
      setSavedAs(status);
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["library-stats"] });
      qc.invalidateQueries({ queryKey: ["library-genres"] });
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
      {savedAs || item.inLibrary ? (
        <span className="flex items-center gap-1.5 rounded-lg bg-gold-400/15 px-2.5 py-1.5 text-xs font-semibold text-gold-300">
          <Check className="h-3.5 w-3.5" /> {savedAs ?? "In library"}
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

  const results = useQuery({
    queryKey: ["tmdb-search", debounced],
    queryFn: () => api.search(debounced),
    enabled: debounced.trim().length >= 2,
  });

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
    else setQ("");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-ink-850 ring-1 ring-white/12 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3.5">
              <Search className="h-[18px] w-[18px] text-gold-400" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search films & series to add…"
                className="flex-1 bg-transparent text-[0.95rem] text-mist-200 placeholder-mist-400/50 outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-mist-400 transition hover:bg-white/[0.06] hover:text-mist-200"
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
              {!results.isFetching && results.data?.length === 0 && (
                <p className="py-8 text-center text-sm text-mist-400">
                  Nothing found — try another spelling.
                </p>
              )}
              {!results.isFetching &&
                results.data?.map((item) => (
                  <ResultRow key={`${item.mediaType}${item.tmdbId}`} item={item} />
                ))}
              {!results.data && !results.isFetching && (
                <p className="py-8 text-center text-sm text-mist-400/70">
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
