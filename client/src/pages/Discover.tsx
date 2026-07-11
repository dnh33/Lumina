import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Info, Plus, Sparkles, Star } from "lucide-react";
import { api } from "../lib/api";
import { backdrop } from "../lib/img";
import { PosterCard } from "../components/PosterCard";
import { Carousel } from "../components/Carousel";
import { EmptyState, HeroSkeleton, PosterSkeletonRow } from "../components/Bits";
import type { CatalogItem } from "../lib/types";

function Hero({ item }: { item: CatalogItem }) {
  const navigate = useNavigate();
  const src = backdrop(item.backdropPath, "w1280");
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative mb-12 overflow-hidden rounded-3xl ring-1 ring-white/10"
    >
      <div className="relative h-[400px] sm:h-[440px]">
        {src && (
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-gold-400">
            Trending this week
          </p>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
            {item.title}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-[0.82rem] text-mist-300">
            {item.voteAverage != null && (
              <span className="flex items-center gap-1 font-semibold text-gold-300">
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
              className="flex items-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
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
              className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-4 py-2.5 text-sm font-semibold text-mist-200 ring-1 ring-white/15 backdrop-blur transition hover:bg-white/[0.14]"
            >
              <Sparkles className="h-4 w-4 text-gold-400" /> Ask Lumina
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function MoodBar() {
  const navigate = useNavigate();
  const [mood, setMood] = useState("");
  const go = () => {
    if (!mood.trim()) return;
    navigate("/chat", {
      state: {
        prefill: `I'm in the mood for: ${mood.trim()}. Suggest a few things that fit my taste — no spoilers.`,
      },
    });
  };
  return (
    <div className="panel mb-12 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2.5 sm:w-64 sm:shrink-0">
        <Sparkles className="h-5 w-5 text-gold-400" />
        <p className="text-sm font-medium text-mist-200">
          What are you in the mood for?
        </p>
      </div>
      <input
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder="cozy autumn mystery… mind-bending escapism… quiet emotional drama…"
        className="w-full flex-1 rounded-xl bg-ink-800/80 px-4 py-2.5 text-sm text-mist-200 placeholder-mist-400/50 outline-none ring-1 ring-white/10 transition focus:ring-gold-400/50"
      />
      <button
        type="button"
        onClick={go}
        className="flex items-center justify-center gap-2 rounded-xl bg-gold-400 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-300"
      >
        Match me <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function Discover() {
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const trending = useQuery({
    queryKey: ["trending"],
    queryFn: api.trending,
    enabled: health.data?.tmdbConfigured === true,
  });
  const forYou = useQuery({
    queryKey: ["for-you"],
    queryFn: api.forYou,
    enabled: health.data?.tmdbConfigured === true,
  });
  const because = useQuery({
    queryKey: ["because"],
    queryFn: api.because,
    enabled: health.data?.tmdbConfigured === true,
  });
  const popularMovies = useQuery({
    queryKey: ["popular", "movie"],
    queryFn: () => api.popular("movie"),
    enabled: health.data?.tmdbConfigured === true,
  });
  const topTv = useQuery({
    queryKey: ["top-rated", "tv"],
    queryFn: () => api.topRated("tv"),
    enabled: health.data?.tmdbConfigured === true,
  });

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
      {trending.isLoading ? (
        <HeroSkeleton />
      ) : heroItem ? (
        <Hero item={heroItem} />
      ) : null}

      <MoodBar />

      {forYou.data && forYou.data.items.length > 0 && (
        <Carousel
          title="For you"
          eyebrow={`Because you rate ${forYou.data.basedOn.join(", ")} highly`}
        >
          {forYou.data.items.map((i) => (
            <PosterCard key={`${i.mediaType}${i.tmdbId}`} item={i} />
          ))}
        </Carousel>
      )}

      {because.data?.source && because.data.items.length > 0 && (
        <Carousel
          title={`Because you loved ${because.data.source.title}`}
          eyebrow="Kindred spirits"
        >
          {because.data.items.map((i) => (
            <PosterCard key={`${i.mediaType}${i.tmdbId}`} item={i} />
          ))}
        </Carousel>
      )}

      {trending.isLoading ? (
        <PosterSkeletonRow />
      ) : (
        rest.length > 0 && (
          <Carousel title="Trending now" eyebrow="The world is watching">
            {rest.map((i) => (
              <PosterCard key={`${i.mediaType}${i.tmdbId}`} item={i} />
            ))}
          </Carousel>
        )
      )}

      {popularMovies.data && (
        <Carousel title="Popular films" eyebrow="On every screen">
          {popularMovies.data.map((i) => (
            <PosterCard key={i.tmdbId} item={i} />
          ))}
        </Carousel>
      )}

      {topTv.data && (
        <Carousel title="Acclaimed series" eyebrow="Television at its finest">
          {topTv.data.map((i) => (
            <PosterCard key={i.tmdbId} item={i} />
          ))}
        </Carousel>
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
    </div>
  );
}
