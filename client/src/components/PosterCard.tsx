import { memo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  Bookmark,
  Check,
  EyeOff,
  Loader2,
  MoreHorizontal,
  Plus,
  Star,
  Ban,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { invalidateLibraryData } from "../lib/invalidate";
import { poster } from "../lib/img";
import { playCue } from "../lib/sound";
import { CriticsBadge } from "./CriticsBadge";
import type { CatalogItem } from "../lib/types";

interface Props {
  item: CatalogItem;
  /** personal rating badge (library views) */
  myRating?: number | null;
  subtitle?: string;
  width?: string;
  /** Top-10 style ranking numeral behind the card (Trending row) */
  rank?: number;
  /** library entry id — enables the retire-as-anchor anti-fatigue toggle */
  libraryId?: number;
}

export const PosterCard = memo(function PosterCard({
  item,
  myRating,
  subtitle,
  width = "w-[138px] sm:w-[152px] lg:w-[168px]",
  rank,
  libraryId,
}: Props) {
  const qc = useQueryClient();
  const reduceMotion = useReducedMotion();
  const [saved, setSaved] = useState(!!item.inLibrary);
  const [ignored, setIgnored] = useState(!!item.ignored);
  const [imgFailed, setImgFailed] = useState(false);
  const [failedSave, setFailedSave] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const src = poster(item.posterPath);

  // anti-fatigue: fetch retire/over-used state for library-owned cards
  const anchor = useQuery({
    queryKey: ["anchorRetired", libraryId],
    queryFn: () => api.anchorRetired(libraryId!),
    enabled: libraryId != null,
  });
  const retired = anchor.data?.retired ?? false;
  const fatigued = anchor.data?.fatigued ?? false;

  // keep the badges honest when fresher catalog data arrives
  useEffect(() => setSaved(!!item.inLibrary), [item.inLibrary]);
  useEffect(() => setIgnored(!!item.ignored), [item.ignored]);
  useEffect(
    () => () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    },
    [],
  );

  const add = useMutation({
    mutationFn: (status: "watched" | "watchlist") =>
      api.addToLibrary({
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        status,
      }),
    onSuccess: () => {
      playCue("success");
      setSaved(true);
      setFailedSave(false);
      setMenuOpen(false);
      invalidateLibraryData(qc);
    },
    onError: () => {
      setFailedSave(true);
      setTimeout(() => setFailedSave(false), 2500);
    },
  });

  const ignore = useMutation({
    mutationFn: () =>
      api.ignore({ tmdbId: item.tmdbId, mediaType: item.mediaType }),
    onSuccess: () => {
      playCue("toggle");
      setIgnored(true);
      setMenuOpen(false);
      invalidateLibraryData(qc);
    },
  });

  // anti-fatigue: retire/unretire a library title as a comparison anchor
  const retire = useMutation({
    mutationFn: () => api.retireAnchor(libraryId!),
    onSuccess: () => {
      playCue("toggle");
      qc.invalidateQueries({ queryKey: ["anchorRetired", libraryId] });
      setMenuOpen(false);
    },
  });
  const unretire = useMutation({
    mutationFn: () => api.unretireAnchor(libraryId!),
    onSuccess: () => {
      playCue("toggle");
      qc.invalidateQueries({ queryKey: ["anchorRetired", libraryId] });
      setMenuOpen(false);
    },
  });

  // 2s dwell reveals the quick-action bubble (mouse only; touch uses the
  // ⋯ toggle, and reduced-motion users keep the plain hover controls).
  const onEnter = () => {
    if (reduceMotion || menuOpen) return;
    hoverTimer.current = setTimeout(() => setMenuOpen(true), 2000);
  };
  const onLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setMenuOpen(false);
  };

  const busy = add.isPending || ignore.isPending;

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`group relative shrink-0 ${width} ${
        rank !== undefined ? (rank >= 10 ? "pl-10 sm:pl-11" : "pl-7 sm:pl-8") : ""
      }`}
    >
      {rank !== undefined && (
        <span
          aria-hidden
          className={`pointer-events-none absolute -left-1 bottom-14 z-0 select-none font-display font-bold leading-none text-white/[0.07] [text-shadow:0_0_1px_rgba(232,184,75,0.15)] ${
            rank >= 10 ? "text-[3.8rem] tracking-[-0.08em]" : "text-[5.5rem]"
          }`}
        >
          {rank}
        </span>
      )}

      {/* stretched link covers the whole card; controls sit above it */}
      <Link
        to={`/title/${item.mediaType}/${item.tmdbId}`}
        aria-label={item.title}
        className="absolute inset-0 z-[5] rounded-xl"
      />

      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-700 ring-1 ring-white/10 transition-all duration-300 group-hover:ring-gold-400/50 group-hover:shadow-[0_12px_40px_-8px_rgba(232,184,75,0.25)]">
        {src && !imgFailed ? (
          <img
            src={src}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${ignored ? "opacity-40 saturate-50" : ""}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center font-display text-sm text-mist-400">
            {item.title}
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {item.voteAverage != null && item.voteAverage > 0 && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-ink-950/80 px-1.5 py-0.5 text-2xs font-semibold tabular-nums text-gold-300 backdrop-blur">
            <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
            {item.voteAverage.toFixed(1)}
          </div>
        )}
        {item.imdbRating != null && (
          <CriticsBadge source="imdb" score={item.imdbRating} variant="compact" className="absolute left-2 top-9" />
        )}
        {item.rtRating != null && (
          <CriticsBadge source="rt" score={item.rtRating} variant="compact" className="absolute bottom-2 left-2" />
        )}
        {myRating != null && (
          <div className="absolute right-2 top-2 z-[6] rounded-md bg-gold-400 px-1.5 py-0.5 text-2xs font-bold tabular-nums text-ink-950">
            {myRating}
          </div>
        )}
        {ignored && (
          <div className="absolute left-1/2 top-1/2 z-[6] -translate-x-1/2 -translate-y-1/2 rounded-md bg-ink-950/85 px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-mist-400 ring-1 ring-white/15 backdrop-blur">
            <EyeOff className="mr-1 inline h-3 w-3 align-[-2px]" />
            Ignored
          </div>
        )}
        {libraryId != null && fatigued && !retired && (
          <div className="absolute right-2 top-1/2 z-[6] -translate-y-1/2 rounded-md bg-amber-500/15 px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/40 backdrop-blur">
            Over-used
          </div>
        )}

        {/* quick-action bubble — appears after a 2s hover dwell or the ⋯ tap */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              role="menu"
              aria-label={`Quick actions for ${item.title}`}
              className="absolute inset-x-2 bottom-13 z-20 flex flex-col overflow-hidden rounded-xl bg-ink-950/90 ring-1 ring-white/15 backdrop-blur"
            >
              <button
                type="button"
                role="menuitem"
                disabled={busy || saved}
                onClick={() => add.mutate("watched")}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium text-mist-200 transition hover:bg-gold-400 hover:text-ink-950 disabled:cursor-default disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Watched
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={busy || saved}
                onClick={() => add.mutate("watchlist")}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium text-mist-200 transition hover:bg-gold-400 hover:text-ink-950 disabled:cursor-default disabled:opacity-50"
              >
                <Bookmark className="h-3.5 w-3.5" /> Watchlist
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={busy || ignored}
                onClick={() => ignore.mutate()}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium text-mist-300 transition hover:bg-white/10 disabled:cursor-default disabled:opacity-50"
              >
                {ignore.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                Ignore
                </button>
                {libraryId != null && (
                <button
                  type="button"
                  role="menuitem"
                  disabled={retire.isPending || unretire.isPending}
                  onClick={() => (retired ? unretire.mutate() : retire.mutate())}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium text-mist-300 transition hover:bg-white/10 disabled:cursor-default disabled:opacity-50"
                >
                  {retire.isPending || unretire.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Ban className="h-3.5 w-3.5" />
                  )}
                  {retired ? "Anchor active" : "Retire as anchor"}
                </button>
                )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* menu toggle — the touch/no-hover path into the bubble */}
        <button
          type="button"
          aria-label={`More actions for ${item.title}`}
          aria-expanded={menuOpen}
          onClick={() => {
            if (hoverTimer.current) clearTimeout(hoverTimer.current);
            setMenuOpen((v) => !v);
          }}
          className={`absolute left-2 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-ink-950/80 text-mist-200 ring-1 ring-white/20 backdrop-blur transition-all duration-200 hover:bg-white/15 focus-visible:opacity-100 max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100 ${
            item.rtRating != null ? "bottom-10" : "bottom-2"
          }`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {/* quick save — anchored inside the artwork, always visible on touch */}
        <button
          type="button"
          aria-label={
            failedSave
              ? "Save failed — tap to retry"
              : saved
                ? "In your library"
                : `Save ${item.title} to watchlist`
          }
          title={failedSave ? "Save failed — tap to retry" : saved ? "In your library" : "Save to watchlist"}
          disabled={saved || add.isPending}
          onClick={() => add.mutate("watchlist")}
          className={`absolute bottom-2 right-2 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full backdrop-blur transition-all duration-200 ${
            saved
              ? "bg-gold-400 text-ink-950 opacity-100"
              : failedSave
                ? "bg-red-500/20 text-red-300 ring-1 ring-red-400/50 opacity-100"
                : "bg-ink-950/80 text-mist-200 ring-1 ring-white/20 hover:bg-gold-400 hover:text-ink-950 max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100"
          }`}
        >
          {add.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : failedSave ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="mt-2 px-0.5">
        <p className="truncate text-[0.82rem] font-medium text-mist-200">
          {item.title}
        </p>
        <p className="text-2xs text-mist-400">
          {subtitle ?? [item.year, item.mediaType === "tv" ? "Series" : "Film"].filter(Boolean).join(" · ")}
        </p>
      </div>
    </motion.div>
  );
});
