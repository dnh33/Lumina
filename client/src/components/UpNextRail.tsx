import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Play } from "lucide-react";
import { api } from "../lib/api";
import { backdrop } from "../lib/img";
import type { UpNextItem } from "../lib/types";

const SHIELD_KEY = "lumina-spoiler-shield";

function shieldOn(): boolean {
  const raw = localStorage.getItem(SHIELD_KEY);
  return raw === null ? true : raw === "1";
}

function UpNextCard({ item }: { item: UpNextItem }) {
  const qc = useQueryClient();
  const bg = backdrop(item.entry.backdropPath, "w780");
  const blurName =
    !!item.next && item.next.episode !== 1 && shieldOn();

  const markWatched = useMutation({
    mutationFn: () => api.setEpisode(item.next!.episodeId, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["up-next"] });
      qc.invalidateQueries({ queryKey: ["episodes"] });
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["library-stats"] });
    },
  });

  return (
    <div className="group relative w-[280px] shrink-0 overflow-hidden rounded-2xl bg-ink-800 ring-1 ring-white/10 transition-all duration-300 hover:ring-gold-400/50">
      <Link
        to={`/title/${item.entry.mediaType}/${item.entry.tmdbId}`}
        aria-label={item.entry.title}
        className="absolute inset-0 z-[5]"
      />
      <div className="relative h-[126px]">
        {bg ? (
          <img
            src={bg}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-ink-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent" />
        {item.hasNewEpisode && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-gold-400 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-ink-950">
            New
          </span>
        )}
      </div>

      <div className="relative p-3.5 pt-1">
        <p className="truncate font-display text-[1.02rem] font-semibold text-mist-200">
          {item.entry.title}
        </p>
        {item.next ? (
          <p className="mt-0.5 truncate text-2xs text-mist-400">
            <span className="font-semibold tabular-nums text-gold-300">
              S{item.next.season} · E{item.next.episode}
            </span>
            {item.next.name && (
              <span className={`ml-1.5 ${blurName ? "spoiler-blur" : ""}`} aria-hidden={blurName}>
                {item.next.name}
              </span>
            )}
          </p>
        ) : (
          <p className="mt-0.5 text-2xs text-mist-400">
            {item.entry.mediaType === "tv"
              ? "Open to sync episodes"
              : "In progress"}
          </p>
        )}

        {item.total > 0 && (
          <div className="mt-2.5 flex items-center gap-2.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400"
                style={{ width: `${(item.watched / item.total) * 100}%` }}
              />
            </div>
            <span className="text-2xs tabular-nums text-mist-400">
              {item.watched}/{item.total}
            </span>
            {item.next && (
              <button
                type="button"
                aria-label={`Mark S${item.next.season}E${item.next.episode} watched`}
                title="Mark next episode watched"
                disabled={markWatched.isPending}
                onClick={() => markWatched.mutate()}
                className="z-10 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/[0.07] text-mist-300 ring-1 ring-white/15 transition hover:bg-gold-400 hover:text-ink-950"
              >
                {markWatched.isPending ? (
                  <Check className="h-3.5 w-3.5 animate-pulse" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** "Up next" — continue-watching rail with exact next episodes. */
export function UpNextRail() {
  const q = useQuery({ queryKey: ["up-next"], queryFn: api.upNext });
  if (!q.data || q.data.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-3">
        <p className="eyebrow mb-0.5">Pick up where you left off</p>
        <h2 className="font-display text-xl font-semibold text-mist-200">
          Up next
        </h2>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {q.data.map((i) => (
          <UpNextCard key={i.entry.id} item={i} />
        ))}
      </div>
    </section>
  );
}
