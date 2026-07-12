import { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check, Loader2, Plus, Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { invalidateLibraryData } from "../lib/invalidate";
import { poster } from "../lib/img";
import type { CatalogItem } from "../lib/types";

interface Props {
  item: CatalogItem;
  /** personal rating badge (library views) */
  myRating?: number | null;
  subtitle?: string;
  width?: string;
  /** Top-10 style ranking numeral behind the card (Trending row) */
  rank?: number;
}

export const PosterCard = memo(function PosterCard({
  item,
  myRating,
  subtitle,
  width = "w-[138px] sm:w-[152px] lg:w-[168px]",
  rank,
}: Props) {
  const qc = useQueryClient();
  const reduceMotion = useReducedMotion();
  const [saved, setSaved] = useState(!!item.inLibrary);
  const [imgFailed, setImgFailed] = useState(false);
  const [failedSave, setFailedSave] = useState(false);
  const src = poster(item.posterPath);

  // keep the badge honest when fresher catalog data arrives
  useEffect(() => setSaved(!!item.inLibrary), [item.inLibrary]);

  const add = useMutation({
    mutationFn: () =>
      api.addToLibrary({
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        status: "watchlist",
      }),
    onSuccess: () => {
      setSaved(true);
      setFailedSave(false);
      invalidateLibraryData(qc);
    },
    onError: () => {
      setFailedSave(true);
      setTimeout(() => setFailedSave(false), 2500);
    },
  });

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
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
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
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
        {myRating != null && (
          <div className="absolute right-2 top-2 rounded-md bg-gold-400 px-1.5 py-0.5 text-2xs font-bold tabular-nums text-ink-950">
            {myRating}
          </div>
        )}

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
          onClick={() => add.mutate()}
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
