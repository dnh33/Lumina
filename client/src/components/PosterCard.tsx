import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Plus, Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { poster } from "../lib/img";
import type { CatalogItem } from "../lib/types";

interface Props {
  item: CatalogItem;
  /** personal rating badge (library views) */
  myRating?: number | null;
  subtitle?: string;
  width?: string;
}

export const PosterCard = memo(function PosterCard({
  item,
  myRating,
  subtitle,
  width = "w-[138px] sm:w-[152px] lg:w-[168px]",
}: Props) {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(!!item.inLibrary);
  const src = poster(item.posterPath);

  const add = useMutation({
    mutationFn: () =>
      api.addToLibrary({
        tmdbId: item.tmdbId,
        mediaType: item.mediaType,
        status: "watchlist",
      }),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["library-stats"] });
    },
  });

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={`group relative shrink-0 ${width}`}
    >
      <Link to={`/title/${item.mediaType}/${item.tmdbId}`} className="block">
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-700 ring-1 ring-white/10 transition-all duration-300 group-hover:ring-gold-400/50 group-hover:shadow-[0_12px_40px_-8px_rgba(232,184,75,0.25)]">
          {src ? (
            <img
              src={src}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-3 text-center font-display text-sm text-mist-400">
              {item.title}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {item.voteAverage != null && item.voteAverage > 0 && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-ink-950/80 px-1.5 py-0.5 text-[0.68rem] font-semibold text-gold-300 backdrop-blur">
              <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
              {item.voteAverage.toFixed(1)}
            </div>
          )}
          {myRating != null && (
            <div className="absolute right-2 top-2 rounded-md bg-gold-400 px-1.5 py-0.5 text-[0.68rem] font-bold text-ink-950">
              {myRating}
            </div>
          )}
        </div>
      </Link>

      {/* quick save */}
      <button
        type="button"
        title={saved ? "In your library" : "Save to watchlist"}
        disabled={saved || add.isPending}
        onClick={() => add.mutate()}
        className={`absolute bottom-[4.4rem] right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-all duration-200 ${
          saved
            ? "bg-gold-400 text-ink-950 opacity-100"
            : "bg-ink-950/80 text-mist-200 opacity-0 ring-1 ring-white/20 hover:bg-gold-400 hover:text-ink-950 group-hover:opacity-100"
        }`}
      >
        {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>

      <div className="mt-2 px-0.5">
        <p className="truncate text-[0.82rem] font-medium text-mist-200">
          {item.title}
        </p>
        <p className="text-[0.72rem] text-mist-400">
          {subtitle ?? [item.year, item.mediaType === "tv" ? "Series" : "Film"].filter(Boolean).join(" · ")}
        </p>
      </div>
    </motion.div>
  );
});
