import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getGenreWorld } from "../lib/genreWorld.js";
import { countryName, watchProviderNames } from "../lib/genreNames.js";
import type { WatchProviders } from "../lib/types.js";
import { Carousel } from "../components/Carousel.js";
import { PosterCard } from "../components/PosterCard.js";
import { ExperienceHero } from "../components/genre/ExperienceHero.js";
import { AnchorFrame } from "../components/genre/AnchorFrame.js";
import { GenreModules } from "../components/genre/GenreModules.js";
import { GenreEmptyState } from "../components/genre/GenreEmptyState.js";

/** Niche-genre gate (design R6 / metric 9): below this many titles, show a
 *  tailored empty state instead of a thin rail. */
const NICHE_THRESHOLD = 6;

export default function GenreExperience() {
  const { slug = "documentary" } = useParams<{ slug: string }>();
  const world = getGenreWorld(slug);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["genre-experience", slug],
    queryFn: () => api.genreExperience([slug], "self", "movie", world.modules),
  });

  const navigate = useNavigate();
  const openGuided = () => {
    const hook = data?.intro?.hook;
    navigate("/chat", {
      state: {
        prefill: hook
          ? `${hook} Take me deeper into the ${slug} world — what should I watch next and why?`
          : `Walk me into the ${slug} world. What should I watch next and why?`,
      },
    });
  };

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
    if (world.modules.includes("argument") && e.argument) {
      maps.arguments[it.tmdbId] = e.argument;
    }
    if (world.modules.includes("geo") && e.originCountry.length) {
      maps.geo[it.tmdbId] = e.originCountry.map((code) => ({ code, name: countryName(code), count: 1 }));
    }
  }

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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
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
            arguments={maps.arguments}
            geo={maps.geo}
            makers={maps.makers}
          />

          <Carousel title="For You in this World" eyebrow="Seeded by the genre you chose">
            {data.items.map((it) => (
              <PosterCard key={`${it.mediaType}:${it.tmdbId}`} item={it} width="w-full" />
            ))}
          </Carousel>

          {data.intro?.hook && (
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
