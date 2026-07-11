import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Loader2, Shield, ShieldOff } from "lucide-react";
import { api } from "../lib/api";
import type { EpisodeRow } from "../lib/types";

const SHIELD_KEY = "lumina-spoiler-shield";

function loadShield(): boolean {
  const raw = localStorage.getItem(SHIELD_KEY);
  return raw === null ? true : raw === "1"; // on by default
}

/**
 * Spoiler rule: an unwatched episode's name is blurred — except season
 * premieres (episode 1), which are always safe to see.
 */
function isSpoiler(e: EpisodeRow, shieldOn: boolean): boolean {
  return shieldOn && !e.watched && e.episode !== 1;
}

export function EpisodeTracker({ libraryId }: { libraryId: number }) {
  const qc = useQueryClient();
  const episodes = useQuery({
    queryKey: ["episodes", libraryId],
    queryFn: () => api.episodes(libraryId),
  });
  const [openSeason, setOpenSeason] = useState<number | null>(null);
  const [shield, setShield] = useState(loadShield);

  const toggleShield = () => {
    setShield((s) => {
      localStorage.setItem(SHIELD_KEY, s ? "0" : "1");
      return !s;
    });
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["episodes", libraryId] });
    qc.invalidateQueries({ queryKey: ["library"] });
    qc.invalidateQueries({ queryKey: ["library-stats"] });
    qc.invalidateQueries({ queryKey: ["up-next"] });
  };

  const toggleEpisode = useMutation({
    mutationFn: ({ id, watched }: { id: number; watched: boolean }) =>
      api.setEpisode(id, watched),
    onSuccess: invalidate,
  });
  const toggleSeason = useMutation({
    mutationFn: ({ season, watched }: { season: number; watched: boolean }) =>
      api.setSeason(libraryId, season, watched),
    onSuccess: invalidate,
  });

  const seasons = useMemo(() => {
    const map = new Map<number, EpisodeRow[]>();
    for (const e of episodes.data ?? []) {
      const arr = map.get(e.season) ?? [];
      arr.push(e);
      map.set(e.season, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [episodes.data]);

  if (episodes.isLoading) {
    return (
      <div className="panel flex items-center gap-3 p-5 text-sm text-mist-400">
        <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
        Fetching episodes from TMDB…
      </div>
    );
  }
  if (episodes.isError) {
    return (
      <div className="panel flex items-center justify-between gap-3 p-5">
        <p className="text-sm text-mist-300">
          Couldn't load episodes — {(episodes.error as Error).message}
        </p>
        <button type="button" className="btn-ghost" onClick={() => episodes.refetch()}>
          Retry
        </button>
      </div>
    );
  }
  if (!seasons.length) return null;

  const totalWatched = (episodes.data ?? []).filter((e) => e.watched).length;
  const total = episodes.data?.length ?? 0;

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-mist-200">
            Episode progress
          </h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleShield}
              aria-pressed={shield}
              title={
                shield
                  ? "Spoiler shield on — unwatched episode titles are hidden"
                  : "Spoiler shield off"
              }
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-2xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                shield
                  ? "bg-gold-400/[0.12] text-gold-300 ring-1 ring-gold-400/30"
                  : "bg-white/[0.05] text-mist-400 ring-1 ring-white/10 hover:text-mist-200"
              }`}
            >
              {shield ? (
                <Shield className="h-3.5 w-3.5" />
              ) : (
                <ShieldOff className="h-3.5 w-3.5" />
              )}
              Spoiler shield
            </button>
            <span className="text-sm font-medium tabular-nums text-gold-300">
              {totalWatched} / {total}
            </span>
          </div>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500"
            style={{ width: total ? `${(totalWatched / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {seasons.map(([season, eps]) => {
        const w = eps.filter((e) => e.watched).length;
        const allWatched = w === eps.length;
        const open = openSeason === season;
        return (
          <div key={season} className="border-b border-white/[0.05] last:border-0">
            <div className="flex items-center gap-3 px-5 py-3">
              <button
                type="button"
                onClick={() => setOpenSeason(open ? null : season)}
                aria-expanded={open}
                className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 text-left"
              >
                <ChevronDown
                  className={`h-4 w-4 text-mist-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
                <span className="text-sm font-medium text-mist-200">
                  Season {season}
                </span>
                <span className="text-xs tabular-nums text-mist-400">
                  {w}/{eps.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  toggleSeason.mutate({ season, watched: !allWatched })
                }
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                  allWatched
                    ? "bg-gold-400/[0.12] text-gold-300"
                    : "bg-white/[0.05] text-mist-400 ring-1 ring-white/10 hover:text-mist-200"
                }`}
              >
                {allWatched ? "Unmark season" : "Mark season"}
              </button>
            </div>

            {open && (
              <div className="grid gap-1 px-5 pb-4 sm:grid-cols-2">
                {eps.map((e) => {
                  const hidden = isSpoiler(e, shield);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() =>
                        toggleEpisode.mutate({ id: e.id, watched: !e.watched })
                      }
                      aria-label={
                        hidden
                          ? `Episode ${e.episode} (title hidden by spoiler shield) — mark watched`
                          : `${e.name || `Episode ${e.episode}`} — mark ${e.watched ? "unwatched" : "watched"}`
                      }
                      className="group flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.04]"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${
                          e.watched
                            ? "bg-gold-400 text-ink-950"
                            : "bg-white/[0.06] ring-1 ring-white/15 group-hover:ring-gold-400/40"
                        }`}
                      >
                        {e.watched && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span
                        className={`truncate text-[0.82rem] ${e.watched ? "text-mist-400 line-through decoration-mist-400/40" : "text-mist-300"}`}
                      >
                        <span className="mr-1.5 font-mono text-2xs tabular-nums text-mist-400">
                          {e.episode}
                        </span>
                        <span
                          aria-hidden={hidden}
                          className={hidden ? "spoiler-blur" : undefined}
                        >
                          {e.name || `Episode ${e.episode}`}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
