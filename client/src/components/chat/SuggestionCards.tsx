import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { api } from "../../lib/api";
import { poster } from "../../lib/img";
import type { SuggestionItem } from "../../lib/types";

function Card({ item }: { item: SuggestionItem }) {
  const q = useQuery({
    queryKey: ["title", item.mediaType, item.tmdbId],
    queryFn: () => api.title(item.mediaType, item.tmdbId),
    staleTime: Infinity,
  });
  const details = q.data?.details;
  const src = poster(details?.posterPath, "w185");

  if (q.isPending) {
    return (
      <div className="w-[104px] shrink-0">
        <div className="skeleton aspect-[2/3] rounded-lg" />
        <div className="skeleton mt-1.5 h-3 w-3/4 rounded" />
      </div>
    );
  }

  return (
    <Link
      to={`/title/${item.mediaType}/${item.tmdbId}`}
      className="group w-[104px] shrink-0"
    >
      <div className="aspect-[2/3] overflow-hidden rounded-lg bg-ink-700 ring-1 ring-white/10 transition group-hover:ring-gold-400/50">
        {src ? (
          <img
            src={src}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-2 text-center text-[0.68rem] text-mist-400">
            {item.title}
          </div>
        )}
      </div>
      <p className="mt-1.5 truncate text-[0.72rem] font-medium text-mist-300">
        {item.title}
      </p>
      <p className="flex items-center gap-1 text-[0.66rem] text-mist-400">
        {details?.year ?? item.year ?? ""}
        {details?.voteAverage != null && (
          <>
            <Star className="h-2.5 w-2.5 fill-gold-400 text-gold-400" />
            {details.voteAverage.toFixed(1)}
          </>
        )}
      </p>
    </Link>
  );
}

export function SuggestionCards({ items }: { items: SuggestionItem[] }) {
  return (
    <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.06]">
      {items.slice(0, 6).map((i) => (
        <Card key={`${i.mediaType}${i.tmdbId}`} item={i} />
      ))}
    </div>
  );
}
