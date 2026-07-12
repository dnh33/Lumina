import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, Search, Sparkles, Star, X } from "lucide-react";
import { api } from "../lib/api";
import { poster } from "../lib/img";

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

interface Props {
  /** commit a full-page search (Enter with nothing highlighted) */
  onCommitQuery: (q: string) => void;
  /** active committed query, if any — shows the clear affordance */
  activeQuery: string;
  onClear: () => void;
}

/**
 * The box office: one bar that answers both "find this title" (instant
 * TMDB results, keyboard-first) and "find me a feeling" (hand-off to the
 * AI companion). Enter commits a full results grid below.
 */
export function SearchOmnibar({ onCommitQuery, activeQuery, onClear }: Props) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [q, setQ] = useState(activeQuery);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const debounced = useDebounced(q, 250);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useQuery({
    queryKey: ["tmdb-search", debounced],
    queryFn: () => api.search(debounced),
    enabled: debounced.trim().length >= 2,
  });
  const items = (results.data ?? []).slice(0, 7);

  // stay in sync when the page clears the query externally
  useEffect(() => setQ(activeQuery), [activeQuery]);
  useEffect(() => setHighlighted(-1), [debounced]);

  // dismiss on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const askLumina = useCallback(() => {
    const text = q.trim();
    if (!text) return;
    navigate("/chat", {
      state: {
        prefill: `I'm in the mood for: ${text}. Suggest a few things that fit my taste — no spoilers.`,
      },
    });
  }, [q, navigate]);

  const commit = () => {
    const text = q.trim();
    if (text.length < 2) return;
    setOpen(false);
    onCommitQuery(text);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || !q.trim()) {
      if (e.key === "Enter") commit();
      return;
    }
    // last slot after the results = "Ask Lumina"
    const lastIndex = items.length; // items 0..n-1, mood row = n
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h >= lastIndex ? 0 : h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h <= 0 ? lastIndex : h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlighted >= 0 && highlighted < items.length) {
        const it = items[highlighted];
        setOpen(false);
        navigate(`/title/${it.mediaType}/${it.tmdbId}`);
      } else if (highlighted === items.length) {
        askLumina();
      } else {
        commit();
      }
    }
  };

  const showDropdown = open && q.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative z-30 mb-8">
      <div className="flex items-center gap-3 rounded-2xl bg-ink-800/90 px-4 ring-1 ring-white/10 backdrop-blur transition focus-within:ring-gold-400/50">
        <Search className="h-[18px] w-[18px] shrink-0 text-gold-400" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={showDropdown}
          aria-label="Search films and series, or describe a mood"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search any film or series — or describe a mood…"
          className="w-full bg-transparent py-3.5 text-[0.95rem] text-mist-200 placeholder-mist-400/80 outline-none"
        />
        {results.isFetching && (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold-400" />
        )}
        {(q || activeQuery) && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQ("");
              setOpen(false);
              onClear();
              inputRef.current?.focus();
            }}
            className="icon-btn shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl bg-ink-850 ring-1 ring-white/10 shadow-[0_24px_70px_-16px_rgba(0,0,0,0.8)]"
            role="listbox"
          >
            {results.isError ? (
              <p className="px-4 py-5 text-sm text-red-300/90">
                Search failed — check the connection and try again.
              </p>
            ) : items.length === 0 && !results.isFetching ? (
              <p className="px-4 py-5 text-sm text-mist-400">
                No titles match — try the mood route below.
              </p>
            ) : (
              <ul className="max-h-[46vh] overflow-y-auto p-1.5">
                {items.map((item, i) => {
                  const src = poster(item.posterPath, "w185");
                  return (
                    <li key={`${item.mediaType}${item.tmdbId}`} role="option" aria-selected={highlighted === i}>
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate(`/title/${item.mediaType}/${item.tmdbId}`);
                        }}
                        onMouseEnter={() => setHighlighted(i)}
                        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition ${
                          highlighted === i ? "bg-white/[0.06]" : ""
                        }`}
                      >
                        <span className="h-14 w-10 shrink-0 overflow-hidden rounded-md bg-ink-700 ring-1 ring-white/10">
                          {src && (
                            <img src={src} alt="" className="h-full w-full object-cover" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-mist-200">
                            {item.title}
                          </span>
                          <span className="flex items-center gap-2 text-2xs text-mist-400">
                            {item.year}
                            <span className="uppercase tracking-wider">
                              {item.mediaType === "tv" ? "Series" : "Film"}
                            </span>
                            {item.voteAverage != null && item.voteAverage > 0 && (
                              <span className="flex items-center gap-0.5 tabular-nums text-gold-300/90">
                                <Star className="h-2.5 w-2.5 fill-gold-400 text-gold-400" />
                                {item.voteAverage.toFixed(1)}
                              </span>
                            )}
                          </span>
                        </span>
                        {item.inLibrary && (
                          <span className="shrink-0 rounded-md bg-gold-400/[0.12] px-1.5 py-0.5 text-2xs font-semibold text-gold-300 ring-1 ring-gold-400/25">
                            In library
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
                <li role="option" aria-selected={highlighted === items.length}>
                  <button
                    type="button"
                    onClick={askLumina}
                    onMouseEnter={() => setHighlighted(items.length)}
                    className={`mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl border-t border-white/[0.06] p-2.5 text-left transition ${
                      highlighted === items.length ? "bg-gold-400/[0.08]" : ""
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-400/10 ring-1 ring-gold-400/25">
                      <Sparkles className="h-4 w-4 text-gold-400" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gold-300">
                        Ask Lumina for a mood match
                      </span>
                      <span className="block truncate text-2xs text-mist-400">
                        "{q.trim()}" as a feeling, matched to your taste
                      </span>
                    </span>
                  </button>
                </li>
              </ul>
            )}
            <p className="border-t border-white/[0.06] px-4 py-2 text-2xs text-mist-400">
              ↑↓ navigate · Enter opens · Enter with nothing selected shows all
              results
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
