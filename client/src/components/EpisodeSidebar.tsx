import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { still } from "../lib/img";

const MASK =
  "linear-gradient(to bottom, transparent, black 28px, black calc(100% - 28px), transparent)";

/**
 * Vertical episode scroller for the watch page — same episode data as
 * EpisodeTracker, but built for switching what's playing: click navigates
 * (SPA) to /watch/tv/:tmdbId?s=&e= instead of toggling watched state.
 */
export function EpisodeSidebar({
  libraryId,
  tmdbId,
  season,
  episode,
}: {
  libraryId: number;
  tmdbId: number;
  season: number;
  episode: number;
}) {
  const navigate = useNavigate();
  const episodes = useQuery({
    queryKey: ["episodes", libraryId],
    queryFn: () => api.episodes(libraryId),
  });
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep what's playing in view when the episode changes.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [season, episode, episodes.data]);

  if (episodes.isLoading) {
    return (
      <div className="panel flex items-center gap-3 p-5 text-sm text-mist-400">
        <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
        Fetching episodes…
      </div>
    );
  }
  if (episodes.isError || !episodes.data?.length) return null;

  return (
    <section className="panel overflow-hidden">
      <h3 className="border-b border-white/[0.06] px-5 py-4 font-display text-lg font-semibold text-mist-200">
        Episodes
      </h3>
      <div
        className="max-h-[70vh] space-y-1 overflow-y-auto p-3"
        style={{ maskImage: MASK, WebkitMaskImage: MASK }}
      >
        {episodes.data.map((e) => {
          const active = e.season === season && e.episode === episode;
          const stillSrc = still(e.stillPath);
          return (
            <button
              key={e.id}
              ref={active ? activeRef : undefined}
              type="button"
              aria-current={active ? "true" : undefined}
              onClick={() =>
                navigate(`/watch/tv/${tmdbId}?s=${e.season}&e=${e.episode}`)
              }
              className={`flex w-full cursor-pointer items-start gap-3 rounded-xl p-2 text-left transition ${
                active
                  ? "bg-gold-400/[0.1] ring-1 ring-gold-400/30"
                  : "hover:bg-white/[0.04]"
              }`}
            >
              <span className="relative h-12 w-[82px] shrink-0 overflow-hidden rounded-lg bg-ink-700 ring-1 ring-white/10">
                {stillSrc ? (
                  <img
                    src={stillSrc}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-mono text-2xs text-mist-400">
                    {e.episode}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[0.82rem] ${
                    active ? "text-gold-300" : "text-mist-300"
                  }`}
                >
                  <span className="mr-1.5 font-mono text-2xs tabular-nums text-mist-400">
                    S{e.season}E{e.episode}
                  </span>
                  {e.name || `Episode ${e.episode}`}
                </span>
                {e.overview && (
                  <span className="mt-0.5 line-clamp-2 block text-2xs leading-snug text-mist-400">
                    {e.overview}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
