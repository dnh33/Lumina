import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Play, Star } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { api } from "../../lib/api";
import { poster } from "../../lib/img";
import type { SuggestionItem } from "../../lib/types";
import { EASE_OUT_EXPO, posterDeal, stagger60 } from "../../lib/motion";

/**
 * New cinematic suggestion shape — used by the welcome/empty state.
 * Posters are "dealt in" (rotateX + 60ms stagger) and lift on hover.
 */
export interface Suggestion {
  title: string;
  subtitle?: string;
  poster?: string;
  onClick?: () => void;
}

/* ── Legacy card (preserved public API: items: SuggestionItem[]) ── */

function LegacyCard({ item }: { item: SuggestionItem }) {
  const q = useQuery({
    queryKey: ["title", item.mediaType, item.tmdbId],
    queryFn: () => api.title(item.mediaType, item.tmdbId),
    staleTime: Infinity,
  });
  const details = q.data?.details;
  const src = poster(details?.posterPath, "w185");
  const streaming = details?.watchProviders?.flatrate?.slice(0, 2) ?? [];

  if (q.isPending) {
    return (
      <div className="w-[128px] shrink-0">
        <div className="skeleton aspect-[2/3] rounded-lg" />
        <div className="skeleton mt-1.5 h-3 w-3/4 rounded" />
      </div>
    );
  }

  return (
    <Link to={`/title/${item.mediaType}/${item.tmdbId}`} className="group w-[128px] shrink-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-ink-700 ring-1 ring-white/10 transition group-hover:ring-gold-400/50">
        {src ? (
          <img
            src={src}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center text-2xs text-mist-400">
            {item.title}
          </div>
        )}
        {item.pick && (
          <span
            className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider ${
              item.pick === "stretch"
                ? "bg-gold-400 text-ink-950"
                : "bg-ink-950/85 text-mist-200 ring-1 ring-white/20"
            }`}
          >
            {item.pick}
          </span>
        )}
      </div>
      <p className="mt-1.5 truncate text-2xs font-medium text-mist-300">{item.title}</p>
      <p className="flex items-center gap-1 text-2xs text-mist-400">
        {details?.year ?? item.year ?? ""}
        {details?.voteAverage != null && (
          <>
            <Star className="h-2.5 w-2.5 fill-gold-400 text-gold-400" />
            {details.voteAverage.toFixed(1)}
          </>
        )}
      </p>
      {streaming.length > 0 && (
        <p className="mt-0.5 flex items-center gap-1 truncate text-2xs text-gold-300/90">
          <Play className="h-2.5 w-2.5" />
          {streaming.map((p) => p.name).join(" · ")}
        </p>
      )}
      {item.reason && (
        <p className="mt-1 line-clamp-3 text-2xs leading-snug text-mist-400">{item.reason}</p>
      )}
    </Link>
  );
}

/* ── Cinematic poster card (dealt in) ── */

function PosterCard({ s, reduce }: { s: Suggestion; reduce: boolean }) {
  const cardVariants: Variants = reduce
    ? {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT_EXPO } },
      }
    : posterDeal;

  return (
    <motion.button
      type="button"
      variants={cardVariants}
      whileHover={
        reduce
          ? undefined
          : { y: -6, scale: 1.03, transition: { type: "spring", stiffness: 300, damping: 25 } }
      }
      onClick={s.onClick}
      data-poster-card
      className="group flex w-[150px] shrink-0 flex-col text-left"
      aria-label={s.title}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gradient-to-b from-ink-700 to-ink-800 transition-shadow duration-300 group-hover:ring-1 group-hover:ring-gold-400/50 [transform-style:preserve-3d]">
        {s.poster ? (
          <img src={s.poster} alt={s.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center">
            <span className="font-display text-[0.95rem] font-semibold leading-snug text-mist-200">
              {s.title}
            </span>
          </div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]"
        />
      </div>
      {s.subtitle && (
        <p className="mt-2 text-2xs leading-snug text-mist-400">{s.subtitle}</p>
      )}
    </motion.button>
  );
}

/** Tasteful default set used only when the parent passes nothing (anti-slop #3). */
export const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { title: "What should I watch tonight?", subtitle: "Something from your archive, or a new find" },
  { title: "Build me a slow-burn sci-fi journey", subtitle: "A considered, atmospheric arc" },
  { title: "Anything new on my shows?", subtitle: "Continue what you left mid-season" },
  { title: "What does my taste say about me?", subtitle: "A short read on your ratings" },
];

export interface SuggestionCardsProps {
  /** Legacy API (preserved) — renders TMDB poster cards. */
  items?: SuggestionItem[];
  /** New cinematic API — context-aware dealt-in poster suggestions. */
  suggestions?: Suggestion[];
  className?: string;
}

export function SuggestionCards({ items, suggestions, className }: SuggestionCardsProps) {
  const reduce = useReducedMotion() ?? false;

  if (suggestions && suggestions.length > 0) {
    return (
      <motion.div
        data-deal="posterDeal"
        variants={stagger60}
        initial="hidden"
        animate="show"
        className={`no-scrollbar flex gap-3 overflow-x-auto px-3 py-3 ${className ?? ""}`}
      >
        {suggestions.slice(0, 6).map((s, i) => (
          <PosterCard key={`${s.title}-${i}`} s={s} reduce={reduce} />
        ))}
      </motion.div>
    );
  }

  if (items && items.length > 0) {
    return (
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.06]">
        {items.slice(0, 6).map((i) => (
          <LegacyCard key={`${i.mediaType}${i.tmdbId}`} item={i} />
        ))}
      </div>
    );
  }

  return null;
}
