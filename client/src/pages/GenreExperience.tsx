import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getGenreWorld } from "../lib/genreWorld.js";
import { accentVar } from "../lib/metaphor.js";
import { playWorldCue } from "../lib/worldCue.js";
import { countryName, genreName, watchProviderNames } from "../lib/genreNames.js";
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

  // P2.8: mode (self|guided) + mediaType (movie|tv) are page-scope steer
  // knobs. They live in the queryKey so React Query refetches the server
  // experience whenever the user flips either — real server steering, no
  // URL change required. Defaults preserve the legacy self/movie behavior.
  const [mode, setMode] = useState<"self" | "guided">("self");
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["genre-experience", slug, mode, mediaType],
    queryFn: () => api.genreExperience([slug], mode, mediaType, world.modules),
  });

  // P1.1/2.3: the curator intro is fetched separately so the rails paint
  // without waiting on the LLM. This query is non-blocking for the items.
  const { data: introData } = useQuery({
    queryKey: ["genre-intro", slug, mode, mediaType],
    queryFn: () => api.genreIntro([slug], mode, mediaType, world.modules),
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

  // P2.6: client-side discovery controls. `decade` narrows first (above via
  // visibleItems); then search / tag-filter / sort compose on top. None of
  // this touches the server — it purely re-orders/filters what we already
  // have from the genre experience query.
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"default" | "year" | "rating">("default");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Derive the toggleable genre tags from the items' distinct genre ids,
  // resolved to human names. (CatalogItem has no `tags` field, so genre ids
  // are the only per-title facet we can reliably chip on client-side.)
  const availableTags = useMemo(() => {
    const names = new Set<string>();
    for (const it of visibleItems) {
      for (const gid of it.genreIds ?? []) {
        const name = genreName(gid);
        names.add(name);
      }
    }
    return [...names].sort();
  }, [visibleItems]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const base = visibleItems.filter((it) => {
      if (needle && !it.title.toLowerCase().includes(needle)) return false;
      if (
        activeTags.length &&
        !activeTags.some((t) => (it.genreIds ?? []).some((gid) => genreName(gid) === t))
      ) {
        return false;
      }
      return true;
    });
    if (sort === "year") {
      return [...base].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    }
    if (sort === "rating") {
      return [...base].sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0));
    }
    return base;
  }, [visibleItems, search, sort, activeTags]);

  const toggleTag = (tag: string) =>
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
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

          {/* P2.6 + P2.8: discovery + steer control bar.
              - Search / sort / tag-chips are client-side (re-filter `visibleItems`).
              - Mode + mediaType flip the server queries via the queryKey. */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10">
            <label className="flex items-center gap-2 text-sm text-mist-300">
              <span className="sr-only">Search titles</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search titles…"
                className="w-44 rounded-lg bg-ink-800 px-3 py-1.5 text-sm text-mist-100 outline-none ring-1 ring-white/10 placeholder:text-mist-500 focus:ring-gold-400/60"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-mist-300">
              <span className="text-2xs uppercase tracking-wider text-mist-500">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "default" | "year" | "rating")}
                className="rounded-lg bg-ink-800 px-2 py-1.5 text-sm text-mist-100 outline-none ring-1 ring-white/10 focus:ring-gold-400/60"
              >
                <option value="default">Curated</option>
                <option value="year">Newest</option>
                <option value="rating">Top rated</option>
              </select>
            </label>

            <div
              role="group"
              aria-label="Filter by genre"
              className="flex flex-wrap items-center gap-1.5"
            >
              {availableTags.map((tag) => {
                const on = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-2xs font-medium ring-1 transition-colors ${
                      on
                        ? "bg-gold-400/90 text-ink-950 ring-gold-400/60"
                        : "bg-white/[0.04] text-mist-300 ring-white/10 hover:bg-white/[0.08]"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-3">
              <div
                role="group"
                aria-label="Experience mode"
                className="flex items-center gap-1 rounded-lg bg-ink-800 p-0.5 ring-1 ring-white/10"
              >
                {(["self", "guided"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    className={`rounded-md px-2.5 py-1 text-2xs font-medium capitalize transition-colors ${
                      mode === m
                        ? "bg-gold-400/90 text-ink-950"
                        : "text-mist-300 hover:text-mist-100"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div
                role="group"
                aria-label="Media type"
                className="flex items-center gap-1 rounded-lg bg-ink-800 p-0.5 ring-1 ring-white/10"
              >
                {(["movie", "tv"] as const).map((mt) => (
                  <button
                    key={mt}
                    type="button"
                    aria-pressed={mediaType === mt}
                    onClick={() => setMediaType(mt)}
                    className={`rounded-md px-2.5 py-1 text-2xs font-medium capitalize transition-colors ${
                      mediaType === mt
                        ? "bg-gold-400/90 text-ink-950"
                        : "text-mist-300 hover:text-mist-100"
                    }`}
                  >
                    {mt === "movie" ? "Movies" : "TV"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <GenreModules
            modules={world.modules}
            items={filtered}
            credibility={maps.credibility}
            watchOrder={maps.watchOrder}
            arguments={argumentsMap}
            geo={maps.geo}
            makers={maps.makers}
            selectedDecade={decade}
            onDecade={setDecade}
            anchors={data.anchorsUsed}
          />

          <Carousel title="For You in this World" eyebrow="Seeded by the genre you chose">
            {filtered.map((it) => (
              <PosterCard key={`${it.mediaType}:${it.tmdbId}`} item={it} width="w-full" />
            ))}
          </Carousel>

          {introData?.hook && (
            <button
              onClick={openGuided}
              className="rounded-full bg-[var(--world-accent)]/90 px-5 py-2.5 text-sm font-medium text-ink-950 transition-opacity hover:opacity-90"
            >
              Explore with the Companion
            </button>
          )}
        </>
      )}
    </div>
  );
}
