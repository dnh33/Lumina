import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { Info, Plus, SearchX, Sparkles, Star } from "lucide-react";
import { api } from "../lib/api";
import { backdrop } from "../lib/img";
import { PosterCard } from "../components/PosterCard";
import { Carousel } from "../components/Carousel";
import { SearchOmnibar } from "../components/SearchOmnibar";
import {
  EmptyState,
  HeroSkeleton,
  PosterSkeletonGrid,
  PosterSkeletonRow,
} from "../components/Bits";
import { UpNextRail } from "../components/UpNextRail";
import type { CatalogItem, LibraryEntry } from "../lib/types";

/** Larger poster width for the personalized tier. */
const FEATURED_WIDTH = "w-[164px] sm:w-[184px] lg:w-[204px]";

function toCatalogItem(e: LibraryEntry): CatalogItem {
  return {
    tmdbId: e.tmdbId,
    mediaType: e.mediaType,
    title: e.title,
    year: e.year,
    overview: e.overview,
    posterPath: e.posterPath,
    backdropPath: e.backdropPath,
    voteAverage: e.voteAverage,
    genreIds: [],
    popularity: null,
    inLibrary: true,
  };
}

function Hero({ item }: { item: CatalogItem }) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);
  const src = backdrop(item.backdropPath, "w1280");
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative mb-12 overflow-hidden rounded-3xl ring-1 ring-white/10"
    >
      <div className="relative h-[400px] sm:h-[440px]">
        {src && !imgFailed ? (
          <img
            src={src}
            alt=""
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ink-700 via-ink-850 to-ink-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <p className="eyebrow mb-2">Trending this week</p>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.05] text-white [text-wrap:balance] sm:text-5xl">
            {item.title}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-[0.82rem] text-mist-300">
            {item.voteAverage != null && (
              <span className="flex items-center gap-1 font-semibold tabular-nums text-gold-300">
                <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                {item.voteAverage.toFixed(1)}
              </span>
            )}
            {item.year && <span>{item.year}</span>}
            <span className="uppercase tracking-wider">
              {item.mediaType === "tv" ? "Series" : "Film"}
            </span>
          </div>
          <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-mist-300">
            {item.overview}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              to={`/title/${item.mediaType}/${item.tmdbId}`}
              className="btn-primary"
            >
              <Info className="h-4 w-4" /> Details
            </Link>
            <button
              type="button"
              onClick={() =>
                navigate("/chat", {
                  state: {
                    prefill: `Tell me about "${item.title}"${item.year ? ` (${item.year})` : ""} — would it fit my taste? No spoilers.`,
                  },
                })
              }
              className="btn-ghost backdrop-blur"
            >
              <Sparkles className="h-4 w-4 text-gold-400" /> Ask Lumina
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function RowError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="panel mb-10 flex items-center justify-between gap-4 p-4">
      <p className="text-sm text-mist-300">{label} couldn't load.</p>
      <button type="button" className="btn-ghost" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

/** Full-page takeover when the user commits a search. */
function SearchResults({ query, onClear }: { query: string; onClear: () => void }) {
  const navigate = useNavigate();
  const results = useQuery({
    queryKey: ["tmdb-search", query],
    queryFn: () => api.search(query),
  });

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="eyebrow mb-0.5">The catalog, at your command</p>
          <h2 className="font-display text-2xl font-semibold text-mist-200">
            Results for "{query}"
            {results.data && (
              <span className="ml-2 text-base font-normal tabular-nums text-mist-400">
                {results.data.length}
              </span>
            )}
          </h2>
        </div>
        <button type="button" className="btn-ghost" onClick={onClear}>
          Back to Discover
        </button>
      </div>

      {results.isLoading ? (
        <PosterSkeletonGrid />
      ) : results.isError ? (
        <RowError label="Search" onRetry={() => results.refetch()} />
      ) : results.data && results.data.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(138px,1fr))] gap-x-4 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
          {results.data.map((i) => (
            <PosterCard key={`${i.mediaType}${i.tmdbId}`} item={i} width="w-full" />
          ))}
        </div>
      ) : (
        <div className="panel mx-auto my-14 max-w-lg px-8 py-10 text-center">
          <SearchX className="mx-auto mb-3 h-6 w-6 text-gold-400" />
          <p className="text-sm leading-relaxed text-mist-300">
            Nothing in the catalog matches "{query}".
          </p>
          <button
            type="button"
            className="btn-ghost mx-auto mt-5"
            onClick={() =>
              navigate("/chat", {
                state: {
                  prefill: `I'm in the mood for: ${query}. Suggest a few things that fit my taste — no spoilers.`,
                },
              })
            }
          >
            <Sparkles className="h-4 w-4 text-gold-400" /> Try it as a mood instead
          </button>
        </div>
      )}
    </section>
  );
}

export default function Discover() {
  const [activeQuery, setActiveQuery] = useState("");
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const enabled = health.data?.tmdbConfigured === true;
  const trending = useQuery({ queryKey: ["trending"], queryFn: api.trending, enabled });
  const forYou = useQuery({ queryKey: ["for-you"], queryFn: api.forYou, enabled });
  const because = useQuery({ queryKey: ["because"], queryFn: api.because, enabled });
  const popularMovies = useQuery({
    queryKey: ["popular", "movie"],
    queryFn: () => api.popular("movie"),
    enabled,
  });
  const topTv = useQuery({
    queryKey: ["top-rated", "tv"],
    queryFn: () => api.topRated("tv"),
    enabled,
  });
  const encoreRail = useQuery({ queryKey: ["encore"], queryFn: api.encore });

  if (health.isError) {
    return (
      <EmptyState title="Lumina's engine isn't answering">
        The local API isn't reachable. Make sure the server is running
        (npm run dev), then refresh this page.
      </EmptyState>
    );
  }

  if (health.data && !health.data.tmdbConfigured) {
    return (
      <EmptyState title="Connect TMDB to light things up">
        Lumina pulls posters, metadata and discovery from TMDB (free). Add your
        TMDB_ACCESS_TOKEN to the .env file in the repo root, restart, and this
        page becomes a living catalog.
      </EmptyState>
    );
  }

  const heroItem = trending.data?.[0];
  const rest = trending.data?.slice(1) ?? [];

  return (
    <div>
      {/* The box office: search anything, or hand a mood to the AI */}
      <SearchOmnibar
        activeQuery={activeQuery}
        onCommitQuery={setActiveQuery}
        onClear={() => setActiveQuery("")}
      />

      {activeQuery ? (
        <SearchResults query={activeQuery} onClear={() => setActiveQuery("")} />
      ) : (
        <>
          {trending.isLoading ? (
            <HeroSkeleton />
          ) : heroItem ? (
            <Hero item={heroItem} />
          ) : trending.isError ? (
            <RowError label="Trending" onRetry={() => trending.refetch()} />
          ) : null}

          <UpNextRail />

          {/* ── Personal tier: bigger art, gold eyebrows ─────────── */}
          {forYou.isLoading ? (
            <PosterSkeletonRow />
          ) : forYou.isError ? (
            <RowError label="Your recommendations" onRetry={() => forYou.refetch()} />
          ) : (
            forYou.data &&
            forYou.data.items.length > 0 && (
              <Carousel title="For you" eyebrow="Tuned to your taste">
                {forYou.data.items.map((i) => (
                  <PosterCard
                    key={`${i.mediaType}${i.tmdbId}`}
                    item={i}
                    width={FEATURED_WIDTH}
                  />
                ))}
              </Carousel>
            )
          )}

          {because.isLoading ? (
            <PosterSkeletonRow />
          ) : because.isError ? (
            <RowError label="Kindred picks" onRetry={() => because.refetch()} />
          ) : (
            because.data?.source &&
            because.data.items.length > 0 && (
              <Carousel
                title={`Because you loved ${because.data.source.title}`}
                eyebrow="Kindred spirits"
              >
                {because.data.items.map((i) => (
                  <PosterCard
                    key={`${i.mediaType}${i.tmdbId}`}
                    item={i}
                    width={FEATURED_WIDTH}
                  />
                ))}
              </Carousel>
            )
          )}

          {(encoreRail.data?.length ?? 0) >= 3 && (
            <Carousel title="The encore" eyebrow="It's been a while — you loved these">
              {encoreRail.data!.map((e) => (
                <PosterCard
                  key={e.id}
                  item={toCatalogItem(e)}
                  myRating={e.rating}
                  subtitle={e.watchedAt ? `Last seen ${e.watchedAt.slice(0, 4)}` : undefined}
                  width={FEATURED_WIDTH}
                />
              ))}
            </Carousel>
          )}

          {/* ── The world's tier: quieter, denser ────────────────── */}
          {(forYou.data?.items.length ||
            because.data?.items.length ||
            (encoreRail.data?.length ?? 0) >= 3) ? (
            <div className="mb-10 border-t border-white/[0.06]" aria-hidden />
          ) : null}

          {trending.isLoading ? (
            <PosterSkeletonRow />
          ) : (
            rest.length > 0 && (
              <Carousel
                title="Trending now"
                eyebrow="Nº 1 is above — the rest of the top ten"
              >
                {rest.slice(0, 9).map((i, idx) => (
                  <PosterCard
                    key={`${i.mediaType}${i.tmdbId}`}
                    item={i}
                    rank={idx + 2}
                  />
                ))}
              </Carousel>
            )
          )}

          {popularMovies.isLoading ? (
            <PosterSkeletonRow />
          ) : popularMovies.isError ? (
            <RowError label="Popular films" onRetry={() => popularMovies.refetch()} />
          ) : (
            popularMovies.data && (
              <Carousel title="Popular films">
                {popularMovies.data.map((i) => (
                  <PosterCard key={i.tmdbId} item={i} />
                ))}
              </Carousel>
            )
          )}

          {topTv.isLoading ? (
            <PosterSkeletonRow />
          ) : topTv.isError ? (
            <RowError label="Acclaimed series" onRetry={() => topTv.refetch()} />
          ) : (
            topTv.data && (
              <Carousel title="Acclaimed series">
                {topTv.data.map((i) => (
                  <PosterCard key={i.tmdbId} item={i} />
                ))}
              </Carousel>
            )
          )}

          {health.data && !health.data.aiConfigured && (
            <div className="panel mb-10 flex items-start gap-3 p-5 text-sm text-mist-300">
              <Plus className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <p>
                The AI companion is waiting for an OpenRouter key — add
                OPENROUTER_API_KEY to your .env to unlock conversations, mood
                matching and personal insights.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
