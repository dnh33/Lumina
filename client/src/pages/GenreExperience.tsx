import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getGenreWorld } from "../lib/genreWorld.js";
import { accentVar } from "../lib/metaphor.js";
import { playWorldCue } from "../lib/worldCue.js";
import { countryName, watchProviderNames } from "../lib/genreNames.js";
import type { WatchProviders } from "../lib/types.js";
import { Carousel } from "../components/Carousel.js";
import { PosterCard } from "../components/PosterCard.js";
import { ExperienceHero } from "../components/genre/ExperienceHero.js";
import { AnchorFrame } from "../components/genre/AnchorFrame.js";
import { GenreModules } from "../components/genre/GenreModules.js";
import { GenreEmptyState } from "../components/genre/GenreEmptyState.js";
import { decadeOf } from "../components/genre/TimelineScrubber.js";

/** Niche-genre gate (design R6 / metric 9): below this many titles, show a
 *  tailored empty state instead of a thin rail. */
const NICHE_THRESHOLD = 6;

export default function GenreExperience() {
  const { slug = "documentary" } = useParams<{ slug: string }>();
  const world = getGenreWorld(slug);

  // Fire the world's "open" beat once per world entry (K5/B5 foundation:
  // consume register.cueBeatMap). Filter-driven "discover" beats are wired
  // in Phase 2 when the page owns the filter state.
  useEffect(() => {
    playWorldCue(world, "open");
  }, [world?.slug]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["genre-experience", slug],
    queryFn: () => api.genreExperience([slug], "self", "movie", world.modules),
  });

  // P1.1/2.3: the curator intro is fetched separately so the rails paint
  // without waiting on the LLM. This query is non-blocking for the items.
  const { data: introData } = useQuery({
    queryKey: ["genre-intro", slug],
    queryFn: () => api.genreIntro([slug], "self", "movie", world.modules),
  });

  const navigate = useNavigate();
  const openGuided = () => {
    const hook = introData?.hook;
    navigate("/chat", {
      state: {
        prefill: hook
          ? `${hook} Take me deeper into the ${slug} world — what should I watch next and why?`
          : `Walk me into the ${slug} world. What should I watch next and why?`,
      },
    });
  };

  // P2.4: page-scope decade filter. `decade` is the single source of truth —
  // null means "all eras"; a number narrows the whole page (rail + scrubber).
  // The TimelineScrubber is a controlled child: it reports picks back here.
  const [decade, setDecade] = useState<number | null>(null);
  const visibleItems = decade == null ? (data?.items ?? []) : (data?.items ?? []).filter(
    (it) => decadeOf(it.year) === decade,
  );

  // P2.2: the `argument` module (LLM thesis + counterpoint) is deferred to
  // AFTER paint. The server no longer runs titleInsight per title (it used to
  // block the rails), so we fetch it lazily per title via the existing
  // GET /insight/:type/:tmdbId route and stream the panels in. This state
  // holds the fetched map keyed by tmdbId; it starts empty so the rails paint
  // from details/ratings immediately.
  const [lazyArguments, setLazyArguments] = useState<Record<number, { thesis: string; counterpoint?: any }>>({});

  useEffect(() => {
    if (!world.modules.includes("argument")) return;
    if (!data?.items?.length) return;
    let cancelled = false;
    Promise.all(
      data.items.map(async (it) => {
        try {
          const insight = await api.insight(it.mediaType, it.tmdbId);
          if (cancelled) return;
          const counter = insight.comparisons?.[0];
          setLazyArguments((prev) => ({
            ...prev,
            [it.tmdbId]: {
              // hook is the one-line thesis; fall back to prose text.
              thesis: insight.hook ?? insight.text,
              counterpoint: counter
                ? {
                    title: counter.title,
                    relation: counter.relation,
                    tmdbId: counter.tmdbId,
                    mediaType: counter.mediaType,
                  }
                : null,
            },
          }));
        } catch {
          // LLM down: skip this title — the rails already painted without it.
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [data, world.modules]);

  // Build per-title module maps from server-computed enrichment.
  const maps = { credibility: {}, watchOrder: {}, arguments: {}, geo: {}, makers: {} } as {
    credibility: Record<number, any>;
    watchOrder: Record<number, any>;
    arguments: Record<number, any>;
    geo: Record<number, any>;
    makers: Record<number, any>;
  };
  for (const it of data?.items ?? []) {
    const e = it.enrichment;
    if (!e) continue;
    if (world.modules.includes("maker") && e.director) {
      maps.makers[it.tmdbId] = { director: e.director, directorId: e.directorId, title: it.title };
    }
    if (world.modules.includes("critic")) {
      maps.credibility[it.tmdbId] = {
        distributor: e.watchProviders ? watchProviderNames(e.watchProviders as WatchProviders | null).join(", ") : null,
        streaming: !!e.watchProviders,
        consensus: e.imdbRating != null ? `IMDb ${e.imdbRating}` : (e.rtRating != null ? `RT ${e.rtRating}` : null),
        stance: null,
      };
    }
    if (world.modules.includes("watchorder") && e.seasons?.length) {
      maps.watchOrder[it.tmdbId] = { seasons: e.seasons, recommendedStart: 1 };
    }
    // NOTE (P2.2): server no longer sets e.argument — it is fetched lazily
    // below (lazyArguments) and merged in for the client.
    if (world.modules.includes("geo") && e.originCountry.length) {
      maps.geo[it.tmdbId] = e.originCountry.map((code) => ({ code, name: countryName(code), count: 1 }));
    }
  }

  // Merge server (legacy) argument enrichment with the lazily-fetched one.
  const argumentsMap = { ...maps.arguments, ...lazyArguments };

  const isNiche = (data?.items.length ?? 0) < NICHE_THRESHOLD;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-40 animate-pulse rounded-3xl bg-white/[0.04]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-white/60">
        Couldn&rsquo;t open this world right now.
      </div>
    );
  }

  return (
    <div
      style={{ ["--world-accent" as any]: accentVar(world) }}
      className="mx-auto max-w-6xl space-y-8 px-4 py-8"
    >
      <ExperienceHero slug={slug} world={world} />

      {isNiche ? (
        <GenreEmptyState world={world} count={data.items.length} threshold={NICHE_THRESHOLD} />
      ) : (
        <>
          <AnchorFrame anchors={data.anchorsUsed} world={world} />

          <GenreModules
            modules={world.modules}
            items={data.items}
            credibility={maps.credibility}
            watchOrder={maps.watchOrder}
            arguments={argumentsMap}
            geo={maps.geo}
            makers={maps.makers}
            selectedDecade={decade}
            onDecade={setDecade}
          />

          <Carousel title="For You in this World" eyebrow="Seeded by the genre you chose">
            {visibleItems.map((it) => (
              <PosterCard key={`${it.mediaType}:${it.tmdbId}`} item={it} width="w-full" />
            ))}
          </Carousel>

          {introData?.hook && (
            <button
              onClick={openGuided}
              className="rounded-full bg-amber-400/90 px-5 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-amber-300"
            >
              Explore with the Companion
            </button>
          )}
        </>
      )}
    </div>
  );
}
