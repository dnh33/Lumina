import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getGenreWorld } from "../lib/genreWorld.js";
import { accentVar } from "../lib/metaphor.js";
import { playWorldCue } from "../lib/worldCue.js";
import { getSoundEnabled } from "../lib/sound.js";
import { countryName, genreName, watchProviderNames } from "../lib/genreNames.js";
import type { WatchProviders } from "../lib/types.js";
import { Carousel } from "../components/Carousel.js";
import { PosterCard } from "../components/PosterCard.js";
import { ExperienceHero } from "../components/genre/ExperienceHero.js";
import { WhisperStrip } from "../components/genre/WhisperStrip.js";
import { AnchorFrame } from "../components/genre/AnchorFrame.js";
import { GenreModules } from "../components/genre/GenreModules.js";
import { GenreEmptyState } from "../components/genre/GenreEmptyState.js";
import { GeoMap, type GeoRegion } from "../components/genre/GeoMap.js";
import { MarathonBuilder } from "../components/genre/MarathonBuilder.js";
import { ExportWorld } from "../components/genre/ExportWorld.js";
import { decadeOf } from "../components/genre/TimelineScrubber.js";
import { useGenreState } from "../lib/useGenreState.js";
import { CompanionPanel } from "../components/genre/CompanionPanel.js";
import { NeighborRail } from "../components/genre/NeighborRail.js";
import { WorldsMap } from "../components/genre/WorldsMap.js";

/** Niche-genre gate (design R6 / metric 9): below this many titles, show a
 *  tailored empty state instead of a thin rail. */
const NICHE_THRESHOLD = 6;

export default function GenreExperience() {
  const { slug = "documentary" } = useParams<{ slug: string }>();
  const world = getGenreWorld(slug);

  // Fire the world's "open" beat once per world entry (K5/B5 foundation:
  // consume register.cueBeatMap). Filter-driven "discover" beats are wired
  // in Phase 2 when the page owns the filter state.
  // B5: gate the cue behind the user's sound preference — no audio autoplay
  // until the user opts in (default OFF).
  useEffect(() => {
    if (!getSoundEnabled()) return;
    playWorldCue(world, "open");
  }, [world?.slug]);

  // P2.8 (B4): mode (self|guided) + mediaType (movie|tv) are page-scope steer
  // knobs. They live in the queryKey so React Query refetches the server
  // experience whenever the user flips either — real server steering, no
  // URL change required. Defaults preserve the legacy self/movie behavior.
  // Task 4.4: exploration state (filter + steer + dismissed) is owned by
  // useGenreState — it is single source of truth, URL-addressable, and
  // persisted to localStorage so the world restores on reload / deep link.
  const gs = useGenreState(slug);
  const {
    decade,
    setDecade,
    search,
    setSearch,
    sort,
    setSort,
    activeTags,
    setActiveTags,
  } = gs;
  const mode = gs.steer.mode;
  const setMode = (m: "self" | "guided") =>
    gs.setSteer({ mode: m, mediaType: gs.steer.mediaType });
  const mediaType = gs.steer.mediaType;
  const setMediaType = (mt: "movie" | "tv") =>
    gs.setSteer({ mode: gs.steer.mode, mediaType: mt });

  // 7.1 (K1): the Movies/TV toggle is deep-linkable via the `?mediaType=tv`
  // search param. `setMediaType` steers the server queries (queryKey); this
  // wrapper additionally mirrors the choice into the URL (replace nav) so a
  // TV world can be shared/bookmarked. 'movie' is the default and is omitted
  // from the URL to keep links tidy.
  const [searchParams, setSearchParams] = useSearchParams();
  const setMediaTypeParam = (mt: "movie" | "tv") => {
    setMediaType(mt);
    const next = new URLSearchParams(searchParams);
    if (mt === "movie") next.delete("mediaType");
    else next.set("mediaType", mt);
    setSearchParams(next, { replace: true });
  };

  // On mount, honor a deep-linked `?mediaType=tv` (default 'movie'). This runs
  // once so a TV world opened from a share link starts in TV mode.
  useEffect(() => {
    const mt = searchParams.get("mediaType");
    if (mt === "tv") setMediaType("tv");
    else if (mt === "movie") setMediaType("movie");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
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

  // P2.4: page-scope decade filter. `decade` is sourced from useGenreState
  // (single source of truth) — null means "all eras"; a number narrows the
  // whole page (rail + scrubber). The TimelineScrubber is a controlled child:
  // it reports picks back here.
  const visibleItems = decade == null ? (data?.items ?? []) : (data?.items ?? []).filter(
    (it) => decadeOf(it.year) === decade,
  );

  // Task 5.2 (D1): a selected decade ZOOMS the world, not just filters. The
  // deterministic, LLM-free era thesis is derived from the decade + the world's
  // metaphor + how many titles live in that decade. No server endpoint is added
  // (per grill): this is a pure client computation that the TimelineScrubber
  // surfaces as the zoomed-era thesis line.
  const eraThesis = useMemo(() => {
    if (decade == null) return undefined;
    const count = visibleItems.length;
    return count === 0
      ? `Era thesis for the ${decade}s: ${world.metaphor} territory, still unexplored.`
      : `Era thesis for the ${decade}s: ${world.metaphor} framed by ${count} ${count === 1 ? "title" : "titles"}.`;
  }, [decade, visibleItems, world.metaphor]);

  // P2.6: client-side discovery controls. `decade` narrows first (above via
  // visibleItems); then search / tag-filter / sort compose on top. None of
  // this touches the server — it purely re-orders/filters what we already
  // have from the genre experience query. `decade/search/sort/activeTags` are
  // sourced from useGenreState (single source of truth).

  // P3.5: "Surprise me" steering preset — a client-only shuffle of the
  // existing rail (no server param). Toggling it re-orders `filtered`.
  const [shuffle, setShuffle] = useState(false);
  // P3.5: "Less well-known" steering preset — a client-only filter that
  // hides the well-known blockbusters (high voteAverage) so the rail surfaces
  // the lesser-known titles. No server param is added.
  const [lessKnown, setLessKnown] = useState(false);

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
    if (shuffle) {
      // deterministic-ish Fisher–Yates on a copy so re-renders are stable
      const out = [...base];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    }
    return base;
  }, [visibleItems, search, sort, activeTags, shuffle, lessKnown]);

  // P3.5 "Less well-known": drop the well-known blockbusters (voteAverage >= 8)
  // entirely on the client so the rail surfaces deeper cuts. Composed after
  // `filtered` so it layers cleanly on top of search/sort/tags/shuffle.
  const steered = useMemo(() => {
    if (!lessKnown) return filtered;
    return filtered.filter((it) => (it.voteAverage ?? 0) < 8);
  }, [filtered, lessKnown]);

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
          const insight = await api.insight(it.mediaType, it.tmdbId, false, true);
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

  // Task 6.2 (D4): aggregate every title's origin regions into one world-wide
  // geo view for the standalone GeoMap section, and derive the user's own
  // library countries (from titles already in their library) so the map can
  // frame "in your library" vs "new to you".
  const geoRegions: GeoRegion[] = useMemo(() => {
    if (!world.modules.includes("geo")) return [];
    const byCode = new Map<string, GeoRegion>();
    for (const list of Object.values(maps.geo)) {
      for (const r of list as GeoRegion[]) {
        const existing = byCode.get(r.code);
        if (existing) existing.count += r.count;
        else byCode.set(r.code, { ...r });
      }
    }
    return [...byCode.values()].sort((a, b) => b.count - a.count);
  }, [world.modules, maps.geo]);

  const libraryCountries: string[] = useMemo(() => {
    const set = new Set<string>();
    for (const it of data?.items ?? []) {
      if (it.inLibrary && it.enrichment?.originCountry?.length) {
        for (const c of it.enrichment.originCountry) set.add(c);
      }
    }
    return [...set];
  }, [data]);

  const isNiche = (data?.items.length ?? 0) < NICHE_THRESHOLD;

  // 7.3 (C3): skip-link target. The skip link (rendered below) focuses this
  // main landmark on activation; we also move focus here on slug change so a
  // deep link / world switch lands keyboard + screen-reader users in content.
  // Declared above the early returns so hook order is stable across renders.
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.focus();
  }, [slug]);

  if (isLoading) {
    // C5 (remount race): CompanionPanel is position:fixed, so DOM order is
    // irrelevant — render it FIRST (index 0) in every branch so its tree
    // position is identical across loading/error/success and React never
    // remounts it when the page refetches on slug change.
    return (
      <>
        <CompanionPanel world={world} />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="h-40 animate-pulse rounded-3xl bg-white/[0.04]" />
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <CompanionPanel world={world} />
        <div className="mx-auto max-w-6xl px-4 py-10 text-white/60">
          Couldn&rsquo;t open this world right now.
          <button
            type="button"
            aria-label="Retry loading this world"
            onClick={() => refetch()}
            className="mt-4 block rounded-lg bg-gold-400/90 px-4 py-2 text-sm font-medium text-ink-950"
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* C5 (remount race): CompanionPanel FIRST (index 0) so its tree
          position is identical across loading/error/success → no remount
          on slug change. position:fixed, so DOM order is visual-irrelevant. */}
      <CompanionPanel world={world} />
      <a
        href="#world-main"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-950"
      >
        Skip to world
      </a>
      <main
        id="world-main"
        tabIndex={-1}
        ref={mainRef}
        style={{ ["--world-accent" as any]: accentVar(world) }}
        className="mx-auto max-w-6xl space-y-8 px-4 py-8 outline-none"
      >
      <ExperienceHero
        slug={slug}
        world={world}
        anchorsUsed={data.anchorsUsed}
        profileState={data.profileState}
      />

      {/* P3.6 (C5): deterministic, LLM-free whisper of the current filter
          state. Sits above the rail so it frames what the user is seeing. */}
      <WhisperStrip
        decade={decade}
        count={data.items.length}
        anchorCount={(data.anchorsUsed ?? []).length}
        unwatched={data.items.filter((it) => !it.inLibrary).length}
      />

      {isNiche ? (
        <GenreEmptyState world={world} count={data.items.length} threshold={NICHE_THRESHOLD} onBootstrap={() => navigate("/library")} />
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
                    onClick={() => setMediaTypeParam(mt)}
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

            {/* P3.5 (C8): steering presets — distinct, additive chips that
              steer the rail via client state only (mode / mediaType / shuffle /
              lessKnown). They are NOT the same as the P2.8 toggle groups above,
              so they carry a `data-preset` marker and unique labels. */}
            <div
              role="group"
              aria-label="Steering presets"
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="mr-1 text-2xs uppercase tracking-wider text-mist-500">Presets</span>
              <button
                type="button"
                data-preset="media-movie"
                aria-label="Steering preset: Movies"
                aria-pressed={mediaType === "movie"}
                onClick={() => setMediaTypeParam("movie")}
                className={`rounded-full px-3 py-1 text-2xs font-medium ring-1 transition-colors ${
                  mediaType === "movie"
                    ? "bg-gold-400/90 text-ink-950 ring-gold-400/60"
                    : "bg-white/[0.04] text-mist-300 ring-white/10 hover:bg-white/[0.08]"
                }`}
              >
                Movies
              </button>
              <button
                type="button"
                data-preset="media-tv"
                aria-label="Steering preset: TV"
                aria-pressed={mediaType === "tv"}
                onClick={() => setMediaTypeParam("tv")}
                className={`rounded-full px-3 py-1 text-2xs font-medium ring-1 transition-colors ${
                  mediaType === "tv"
                    ? "bg-gold-400/90 text-ink-950 ring-gold-400/60"
                    : "bg-white/[0.04] text-mist-300 ring-white/10 hover:bg-white/[0.08]"
                }`}
              >
                TV
              </button>
              <button
                type="button"
                data-preset="mode-guided"
                aria-label="Steering preset: Guided"
                aria-pressed={mode === "guided"}
                onClick={() => setMode("guided")}
                className={`rounded-full px-3 py-1 text-2xs font-medium ring-1 transition-colors ${
                  mode === "guided"
                    ? "bg-gold-400/90 text-ink-950 ring-gold-400/60"
                    : "bg-white/[0.04] text-mist-300 ring-white/10 hover:bg-white/[0.08]"
                }`}
              >
                Guided
              </button>
              <button
                type="button"
                data-preset="surprise"
                aria-pressed={shuffle}
                onClick={() => setShuffle((s) => !s)}
                className={`rounded-full px-3 py-1 text-2xs font-medium ring-1 transition-colors ${
                  shuffle
                    ? "bg-gold-400/90 text-ink-950 ring-gold-400/60"
                    : "bg-white/[0.04] text-mist-300 ring-white/10 hover:bg-white/[0.08]"
                }`}
              >
                Surprise me
              </button>
              <button
                type="button"
                data-preset="less-known"
                aria-pressed={lessKnown}
                onClick={() => setLessKnown((s) => !s)}
                className={`rounded-full px-3 py-1 text-2xs font-medium ring-1 transition-colors ${
                  lessKnown
                    ? "bg-gold-400/90 text-ink-950 ring-gold-400/60"
                    : "bg-white/[0.04] text-mist-300 ring-white/10 hover:bg-white/[0.08]"
                }`}
              >
                Less well-known
              </button>
            </div>

          <GenreModules
            modules={world.modules}
            items={steered}
            credibility={maps.credibility}
            watchOrder={maps.watchOrder}
            arguments={argumentsMap}
            geo={maps.geo}
            makers={maps.makers}
            selectedDecade={decade}
            onDecade={setDecade}
            anchors={data.anchorsUsed}
            world={world}
            eraThesis={eraThesis}
          />

          {world.modules.includes("geo") && geoRegions.length > 0 && (
            <GeoMap regions={geoRegions} libraryCountries={libraryCountries} />
          )}

          {world.modules.includes("watchorder") && (
            <MarathonBuilder
              slug={slug}
              seasons={(steered ?? [])
                .flatMap((it) => maps.watchOrder[it.tmdbId]?.seasons ?? [])
                .map((s) => ({ number: s.number, name: s.name, episodeCount: s.episodeCount, watched: s.watched }))}
              watchlist={steered.map((it) => ({ title: it.title, year: it.year ?? undefined }))}
            />
          )}

          {/* Task 5.1 (C1): cross-world warp. The NeighborRail is the primary
              navigation surface; the WorldsMap is a decorative, optional
              collapsible overview of how worlds connect. */}
          <NeighborRail world={world} />

          <div data-shuffle={shuffle ? "true" : "false"}>
            <Carousel title="For You in this World" eyebrow="Seeded by the genre you chose">
              {steered.map((it) => (
                <PosterCard key={`${it.mediaType}:${it.tmdbId}`} item={it} width="w-full" />
              ))}
            </Carousel>
          </div>

          {introData?.hook && (
            <button
              onClick={openGuided}
              className="rounded-full bg-[var(--world-accent)]/90 px-5 py-2.5 text-sm font-medium text-ink-950 transition-opacity hover:opacity-90"
            >
              Explore with the Companion
            </button>
          )}

          {/* Task 5.1 (C1): optional decorative worlds graph in a collapsible
              panel — complements the NeighborRail, doesn't replace it. */}
          <details className="rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/10">
            <summary className="cursor-pointer text-2xs font-medium uppercase tracking-wider text-mist-500">
              Worlds map
            </summary>
            <WorldsMap />
          </details>

          {/* Task 6.8 (C6): export the curated world as a Markdown note +
              printable view — hero hook + selected titles + annotations.
              annotationsMap is keyed by tmdbId, so re-key it to the same
              index order as `steered` for the export. */}
          <ExportWorld
            slug={slug}
            hook={introData?.hook}
            titles={steered.map((it) => ({ title: it.title, year: it.year ?? undefined }))}
            annotations={steered.reduce<Record<number, string>>((acc, it, i) => {
              const a = argumentsMap[it.tmdbId];
              if (a?.thesis) acc[i] = a.thesis;
              return acc;
            }, {})}
          />

          {/* Task 4.3 (B2): ambient in-world Companion — distinct from the
              global dock (App.tsx hides ChatDock on /genre), no collision.
              Rendered FIRST (index 0) so its tree position matches the
              loading/error branches (C5 remount fix). */}
        </>
      )}
      </main>
    </>
  );
}
