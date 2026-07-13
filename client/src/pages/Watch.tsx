import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { WatchPlayer, WatchPlayerLoading } from "../components/WatchPlayer";
import { EpisodeSidebar } from "../components/EpisodeSidebar";
import { RecapCard } from "./TitleDetail";
import type { MediaType } from "../lib/types";

/**
 * /watch/:type/:tmdbId?s=&e= — in-app viewing, recap-first. The recap
 * ("Previously on…") renders BEFORE the player mounts; playback starts on
 * an explicit gesture. Sources come from the user's local, gitignored
 * config — the app ships none.
 */
export default function Watch() {
  const { type, tmdbId } = useParams<{ type: MediaType; tmdbId: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = Number(tmdbId);
  const isTv = type === "tv";

  const [sourceName, setSourceName] = useState<string | null>(null);

  const title = useQuery({
    queryKey: ["title", type, id],
    queryFn: () => api.title(type as MediaType, id),
    enabled: (type === "movie" || type === "tv") && Number.isFinite(id),
  });
  const library = title.data?.library ?? null;

  const sources = useQuery({ queryKey: ["sources"], queryFn: api.sources });
  useEffect(() => {
    if (!sourceName && sources.data?.length) setSourceName(sources.data[0].name);
  }, [sources.data, sourceName]);
  const source = sources.data?.find((s) => s.name === sourceName) ?? null;

  // Resume point: explicit ?s=&e= wins; otherwise first unwatched episode.
  const episodes = useQuery({
    queryKey: ["episodes", library?.id],
    queryFn: () => api.episodes(library!.id),
    enabled: isTv && library != null,
  });
  const resume = useMemo(() => {
    const next = episodes.data?.find((ep) => !ep.watched);
    return {
      season: Number(params.get("s")) || next?.season || 1,
      episode: Number(params.get("e")) || next?.episode || 1,
    };
  }, [params, episodes.data]);

  // Auto-resolve on mount — navigating to /watch is itself the play intent,
  // so there's no second "Start playing" gate to click through.
  const resolved = useQuery({
    queryKey: ["resolve", sourceName, type, id, isTv ? resume.season : 0, isTv ? resume.episode : 0],
    queryFn: () =>
      api.resolveWatch({
        source: sourceName!,
        type: type as MediaType,
        tmdbId: id,
        ...(isTv ? { season: resume.season, episode: resume.episode } : {}),
      }),
    enabled: !!sourceName,
    staleTime: Infinity,
  });

  if (title.isLoading) {
    return <div className="skeleton h-[420px] w-full rounded-3xl" />;
  }
  if (title.isError || !title.data) {
    return (
      <div className="py-20 text-center text-mist-400">
        <p className="mb-4">{(title.error as Error)?.message ?? "Title not found."}</p>
        <button type="button" className="btn-ghost mx-auto" onClick={() => title.refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const { details } = title.data;
  const showRecap =
    isTv && library != null && (library.watchedEpisodes ?? 0) > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(`/title/${type}/${id}`)}
        className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-mist-400 transition hover:text-gold-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back to {details.title}
      </button>

      <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-display text-3xl font-semibold text-white">
          {details.title}
        </h1>
        {isTv && (
          <span className="text-sm font-medium tabular-nums text-gold-300">
            S{resume.season} · E{resume.episode}
          </span>
        )}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.7fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* Recap-first: "Previously on…" sits above the player (no click gate). */}
          {showRecap && <RecapCard entry={library} />}

          {!source ? (
            <div className="panel flex flex-col items-start gap-3 p-6">
              <p className="text-sm leading-relaxed text-mist-400">
                No sources configured. Copy{" "}
                <code className="text-mist-300">data/sources.local.example.json</code> to{" "}
                <code className="text-mist-300">data/sources.local.json</code> and point
                it at your own media endpoints — that file stays on your machine.
              </p>
            </div>
          ) : resolved.isLoading ? (
            <WatchPlayerLoading title={details.title} />
          ) : resolved.isError ? (
            <div className="panel flex flex-col items-start gap-3 p-5">
              <p className="text-sm leading-relaxed text-red-300/90">
                {(resolved.error as Error).message}
              </p>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={() => resolved.refetch()}>
                  Retry
                </button>
                {resolved.data && (
                  <a
                    href={resolved.data.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost"
                  >
                    Open externally
                  </a>
                )}
              </div>
            </div>
          ) : resolved.data ? (
            <WatchPlayer
              url={resolved.data.url}
              trusted={resolved.data.trusted}
              title={details.title}
              backdropPath={details.backdropPath}
            />
          ) : null}
        </div>

        <div className="space-y-5 self-start lg:sticky lg:top-6">
          {sources.data && sources.data.length > 0 && (
            <section className="panel p-5">
              <label
                htmlFor="watch-source"
                className="mb-2 block text-2xs font-semibold uppercase tracking-wider text-mist-400"
              >
                Source
              </label>
              <select
                id="watch-source"
                value={sourceName ?? ""}
                onChange={(e) => setSourceName(e.target.value)}
                className="w-full cursor-pointer rounded-xl bg-ink-800/80 px-3 py-2.5 text-sm text-mist-200 outline-none ring-1 ring-white/10 transition focus:ring-gold-400/50"
              >
                {sources.data.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                    {s.trusted ? "" : " (sandboxed)"}
                  </option>
                ))}
              </select>
            </section>
          )}
          {isTv && library && (
            <EpisodeSidebar
              libraryId={library.id}
              tmdbId={id}
              season={resume.season}
              episode={resume.episode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
