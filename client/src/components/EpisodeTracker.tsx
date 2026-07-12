import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Loader2, Shield, ShieldOff, Star } from "lucide-react";
import { api } from "../lib/api";
import { invalidateLibraryData } from "../lib/invalidate";
import { still } from "../lib/img";
import type { EpisodeRow } from "../lib/types";

const SHIELD_KEY = "lumina-spoiler-shield";

function loadShield(): boolean {
  const raw = localStorage.getItem(SHIELD_KEY);
  return raw === null ? true : raw === "1"; // on by default
}

/**
 * Spoiler rule: an unwatched episode's name/artwork is blurred — except
 * season premieres (episode 1), which are always safe to see.
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
  const [autoOpened, setAutoOpened] = useState(false);
  const [shield, setShield] = useState(loadShield);

  // Open the season you're actually in — first unwatched episode's season.
  useEffect(() => {
    if (autoOpened || !episodes.data?.length) return;
    const next = episodes.data.find((e) => !e.watched);
    setOpenSeason(next ? next.season : episodes.data[episodes.data.length - 1].season);
    setAutoOpened(true);
  }, [episodes.data, autoOpened]);

  // One-time backfill: shows synced before stills existed re-sync once.
  const backfilled = useRef(false);
  useEffect(() => {
    if (backfilled.current || !episodes.data?.length) return;
    if (episodes.data.every((e) => !e.stillPath)) {
      backfilled.current = true;
      api.episodes(libraryId, true).then(() => {
        qc.invalidateQueries({ queryKey: ["episodes", libraryId] });
      });
    }
  }, [episodes.data, libraryId, qc]);

  const toggleShield = () => {
    setShield((s) => {
      localStorage.setItem(SHIELD_KEY, s ? "0" : "1");
      return !s;
    });
  };

  const finish = () => {
    qc.invalidateQueries({ queryKey: ["episodes", libraryId] });
    invalidateLibraryData(qc);
  };

  const toggleEpisode = useMutation({
    mutationFn: ({ id, watched }: { id: number; watched: boolean }) =>
      api.setEpisode(id, watched),
    // optimistic: flip instantly, roll back on failure
    onMutate: async ({ id, watched }) => {
      await qc.cancelQueries({ queryKey: ["episodes", libraryId] });
      const prev = qc.getQueryData<EpisodeRow[]>(["episodes", libraryId]);
      qc.setQueryData<EpisodeRow[]>(["episodes", libraryId], (old) =>
        (old ?? []).map((e) => (e.id === id ? { ...e, watched } : e)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["episodes", libraryId], ctx.prev);
    },
    onSettled: finish,
  });

  const toggleSeason = useMutation({
    mutationFn: ({ season, watched }: { season: number; watched: boolean }) =>
      api.setSeason(libraryId, season, watched),
    onMutate: async ({ season, watched }) => {
      await qc.cancelQueries({ queryKey: ["episodes", libraryId] });
      const prev = qc.getQueryData<EpisodeRow[]>(["episodes", libraryId]);
      qc.setQueryData<EpisodeRow[]>(["episodes", libraryId], (old) =>
        (old ?? []).map((e) => (e.season === season ? { ...e, watched } : e)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["episodes", libraryId], ctx.prev);
    },
    onSettled: finish,
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
                  ? "Spoiler shield on — unwatched episodes are hidden"
                  : "Spoiler shield off"
              }
              className={`flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-2 text-2xs font-semibold uppercase tracking-wider transition cursor-pointer ${
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
        const bestRated = Math.max(...eps.map((e) => e.voteAverage ?? 0));
        return (
          <div key={season} className="border-b border-white/[0.05] last:border-0">
            <div className="flex items-center gap-3 px-5 py-2">
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
                {w > 0 && !allWatched && (
                  <span className="h-1 w-12 overflow-hidden rounded-full bg-white/[0.07]">
                    <span
                      className="block h-full rounded-full bg-gold-500"
                      style={{ width: `${(w / eps.length) * 100}%` }}
                    />
                  </span>
                )}
              </button>
              <button
                type="button"
                disabled={toggleSeason.isPending}
                onClick={() =>
                  toggleSeason.mutate({ season, watched: !allWatched })
                }
                className={`min-h-9 rounded-lg px-2.5 py-2 text-xs font-medium transition cursor-pointer disabled:opacity-50 ${
                  allWatched
                    ? "bg-gold-400/[0.12] text-gold-300"
                    : "bg-white/[0.05] text-mist-400 ring-1 ring-white/10 hover:text-mist-200"
                }`}
              >
                {allWatched ? "Unmark season" : "Mark season"}
              </button>
            </div>

            {open && (
              <div className="grid gap-1.5 px-5 pb-4 sm:grid-cols-2">
                {eps.map((e) => {
                  const hidden = isSpoiler(e, shield);
                  const stillSrc = still(e.stillPath);
                  const isBest =
                    e.voteAverage != null &&
                    bestRated > 0 &&
                    e.voteAverage === bestRated &&
                    eps.length > 3;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() =>
                        toggleEpisode.mutate({ id: e.id, watched: !e.watched })
                      }
                      aria-label={
                        hidden
                          ? `Episode ${e.episode} (hidden by spoiler shield) — mark watched`
                          : `${e.name || `Episode ${e.episode}`} — mark ${e.watched ? "unwatched" : "watched"}`
                      }
                      className="group flex min-h-12 cursor-pointer items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-white/[0.04]"
                    >
                      <span className="relative h-11 w-[74px] shrink-0 overflow-hidden rounded-lg bg-ink-700 ring-1 ring-white/10">
                        {stillSrc ? (
                          <img
                            src={stillSrc}
                            alt=""
                            loading="lazy"
                            aria-hidden={hidden}
                            className={`h-full w-full object-cover ${hidden ? "spoiler-blur scale-110" : ""}`}
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center font-mono text-2xs text-mist-400">
                            {e.episode}
                          </span>
                        )}
                        <span
                          className={`absolute inset-0 flex items-center justify-center bg-ink-950/55 transition-opacity ${
                            e.watched ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${
                              e.watched
                                ? "bg-gold-400 text-ink-950"
                                : "bg-white/15 text-mist-200 ring-1 ring-white/30"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-[0.82rem] ${e.watched ? "text-mist-400 line-through decoration-mist-400/40" : "text-mist-300"}`}
                        >
                          <span className="mr-1.5 font-mono text-2xs tabular-nums text-mist-400">
                            E{e.episode}
                          </span>
                          <span
                            aria-hidden={hidden}
                            className={hidden ? "spoiler-blur" : undefined}
                          >
                            {e.name || `Episode ${e.episode}`}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-2xs text-mist-400">
                          {e.airDate && <span className="tabular-nums">{e.airDate}</span>}
                          {e.runtime != null && (
                            <span className="tabular-nums">{e.runtime}m</span>
                          )}
                          {isBest && (
                            <span className="flex items-center gap-0.5 text-gold-300">
                              <Star className="h-2.5 w-2.5 fill-gold-400 text-gold-400" />
                              season's best
                            </span>
                          )}
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
