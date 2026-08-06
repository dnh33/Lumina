import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, type Query } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getGenreWorld } from "../lib/genreWorld.js";
import { accentVar } from "../lib/metaphor.js";
import { playWorldCue } from "../lib/worldCue.js";
import { getSoundEnabled } from "../lib/sound.js";
import { countryName, genreName, watchProviderNames } from "../lib/genreNames.js";
import type { WatchProviders } from "../lib/types.js";
import { ExperienceHero } from "../components/genre/ExperienceHero.js";
import { WhisperStrip } from "../components/genre/WhisperStrip.js";
import { GenreModules } from "../components/genre/GenreModules.js";
import { GenreEmptyState } from "../components/genre/GenreEmptyState.js";
import { GeoMap, type GeoRegion } from "../components/genre/GeoMap.js";
import { MarathonBuilder } from "../components/genre/MarathonBuilder.js";
import { ExportWorld } from "../components/genre/ExportWorld.js";
import { decadeOf, pickPreferredDecade } from "../components/genre/TimelineScrubber.js";
import { useGenreState } from "../lib/useGenreState.js";
import { CompanionPanel } from "../components/genre/CompanionPanel.js";
import { NeighborRail } from "../components/genre/NeighborRail.js";
import { GuidedTour } from "../components/genre/GuidedTour.js";
import {
  eraBandFromDecade,
  eraBandLabel,
  eraDialShortName,
  filterItemsToEraBand,
  resolveGuidedEraChoice,
  type EraBandId,
  type GuidedHudStage,
} from "../components/genre/guidedStage.js";
import {
  clearWidenOnModeFlip,
  resolveGuidedWidenOnClaimHome,
} from "../components/genre/claimHomeWiden.js";
import type { GuidedPick } from "../lib/types.js";
import {
  fallbackThesisFromItem,
  normalizeInsightThesis,
  stripInlineMarkdown,
} from "../lib/insightThesis.js";

/**
 * Mode/media restage must not drop into the pulse skeleton (layout thrash).
 * Soft-hold prior payload only while the world slug stays the same.
 */
function keepSameWorldPlaceholder<T>(
  slug: string,
): (previousData: T | undefined, previousQuery: Query | undefined) => T | undefined {
  return (previousData, previousQuery) => {
    if (previousData == null || previousQuery == null) return undefined;
    const prevSlug = previousQuery.queryKey[1];
    if (prevSlug !== slug) return undefined;
    return previousData;
  };
}

/** Niche-genre gate (design R6 / metric 9): below this many titles, show a
 *  tailored empty state instead of a thin rail. */
const NICHE_THRESHOLD = 6;

/** Steer tag peek — Narrow disclosure owns the rest (Wave 2 density). */
const TAG_VISIBLE = 4;

/** Toggle `tag` in a string[]: add if absent, remove if present. Pure — the
 *  caller is responsible for committing the next array (gs.setActiveTags). */
function toggleTagArr(tag: string, arr: string[]): string[] {
  return arr.includes(tag) ? arr.filter((t) => t !== tag) : [...arr, tag];
}

export default function GenreExperience() {
  const { slug = "documentary" } = useParams<{ slug: string }>();
  const world = getGenreWorld(slug);
  // B5b: suppress the very first "discover" cue (fired by the mount-equivalent
  // run of the discover effect) so it doesn't double up with the "open" beat.
  const firstCueRun = useRef(true);

  // Fire the world's "open" beat once per world entry (K5/B5 foundation:
  // consume register.cueBeatMap). Filter-driven "discover" beats are wired
  // in Phase 2 when the page owns the filter state.
  // B5: gate the cue behind the user's sound preference — no audio autoplay
  // until the user opts in (default OFF).
  useEffect(() => {
    if (!getSoundEnabled()) return;
    playWorldCue(world, "open");
  }, [world?.slug]);

  // P2.8 (B4): mediaType + experience mode (self|guided) live in the queryKey
  // so React Query refetches when the user flips either. Guided is a real
  // session-backed tour (G1 2026-08-05) — not cache-key fiction.
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
  const mediaType = gs.steer.mediaType;
  const mode = gs.steer.mode;
  const setMediaType = (mt: "movie" | "tv") =>
    gs.setSteer({ mode: gs.steer.mode, mediaType: mt });
  const setMode = (m: "self" | "guided") =>
    gs.setSteer({ mode: m, mediaType: gs.steer.mediaType });

  /** Live cue from GuidedTour → WhisperStrip (page outcome coupling). */
  const [guidedOutcomeCue, setGuidedOutcomeCue] = useState<string | null>(null);

  /**
   * Guided BROWSE unlock (Mode-split B / Q6-A).
   * ONE Widen UX: claim-desk “Widen / browse archive” → compact chip + tray.
   * No page `<details guided-widen>` — warehouse never bolts under dials.
   * Claim-as-home: sticky widen collapses on Guided enter/remount unless
   * Widen CTA fired this Guided visit (widenIntentRef).
   */
  const [guidedWiden, setGuidedWiden] = useState(false);
  const widenIntentRef = useRef(false);
  const prevModeRef = useRef<"self" | "guided">(mode);
  const [guidedHudStage, setGuidedHudStage] = useState<GuidedHudStage>("dial");
  /** Companion FAB open → GuidedTour deriveGuidedStage deepen (widen wins). */
  const [deepenOpen, setDeepenOpen] = useState(false);

  // Featured thesis for current shelf. Above setDecadeUser so peek→zoom
  // can drop stale All-eras inspect copy before the new shelf paints.
  const [lazyArguments, setLazyArguments] = useState<
    Record<number, { thesis: string; counterpoint?: any }>
  >({});

  /** Decade writes from user / Guided dial — marks decade as intentional.
   *  Cleared on Self entry / media switch so decade-first can land without
   *  fighting TimelineScrubber's All-eras summary. */
  const decadeTouched = useRef(false);
  /**
   * Last intentional Self decade (scrub / user pick). Survives Guided
   * onSteerEra(null) so Guided→Self can restore instead of dial-force.
   * Auto decade-first does NOT write here (decadeTouched stays false).
   */
  const lastSelfDecadeRef = useRef<number | null>(null);
  /** Guided era dial to inherit on Guided→Self (survives query disable). */
  const guidedEraInheritRef = useRef<string | undefined>(undefined);
  /** Pending era-band decade seed after mode flip (cleared once committed). */
  const pendingEraInherit = useRef<string | undefined>(undefined);
  /**
   * Self decade → Guided preferred era band (Self→Guided).
   * Session answers.era still wins via resolveGuidedEraChoice — never wipe.
   */
  const [preferredEraFromSelf, setPreferredEraFromSelf] = useState<
    EraBandId | undefined
  >(undefined);
  /** One-shot announce after Guided→Self inherits dial era → decade. */
  const [selfInheritAnnounce, setSelfInheritAnnounce] = useState<string | null>(
    null,
  );
  /** One-shot announce after Self→Guided inherits decade → era band. */
  const [guidedInheritAnnounce, setGuidedInheritAnnounce] = useState<
    string | null
  >(null);
  const setDecadeUser = (d: number | null) => {
    decadeTouched.current = true;
    pendingEraInherit.current = undefined;
    setSelfInheritAnnounce(null);
    setGuidedInheritAnnounce(null);
    setLazyArguments({});
    // Only Self scrub writes lastSelf — Guided era-clear must not wipe it.
    if (mode === "self") lastSelfDecadeRef.current = d;
    setDecade(d);
  };
  useEffect(() => {
    decadeTouched.current = false;
    lastSelfDecadeRef.current = null;
    guidedEraInheritRef.current = undefined;
    pendingEraInherit.current = undefined;
    setPreferredEraFromSelf(undefined);
    setSelfInheritAnnounce(null);
    setGuidedInheritAnnounce(null);
    // Deep-link / LS scrub with an explicit decade counts as intentional Self.
    // Auto decade-first does not put decade in the URL before this runs.
    const raw = new URLSearchParams(window.location.search).get("decade");
    if (raw) {
      const n = parseInt(raw, 10);
      if (Number.isFinite(n) && n > 0) {
        decadeTouched.current = true;
        lastSelfDecadeRef.current = n;
      }
    }
  }, [slug]);

  const [tagsExpanded, setTagsExpanded] = useState(false);

  // 7.1 (K1): Movies/TV + Guided — steer lives in useGenreState; URL sync
  // is owned there so decade/scrub writes cannot race-drop `mode=guided`.
  // Stale decade from Movies (e.g. 1930s) empties TV shelves — clear on toggle.
  const setMediaTypeParam = (mt: "movie" | "tv") => {
    if (mt !== mediaType) {
      // New catalog axis — allow Self decade-first bootstrap for the new set.
      decadeTouched.current = false;
      lastSelfDecadeRef.current = null;
      pendingEraInherit.current = undefined;
      setPreferredEraFromSelf(undefined);
      setSelfInheritAnnounce(null);
      setGuidedInheritAnnounce(null);
      setDecade(null);
    }
    setMediaType(mt);
  };
  const setModeParam = (m: "self" | "guided") => {
    setMode(m);
    // Mode flip re-stages — never carry widen across Self↔Guided.
    const cleared = clearWidenOnModeFlip();
    widenIntentRef.current = cleared.widenIntent;
    setGuidedWiden(cleared.guidedWiden);
    setGuidedHudStage(m === "guided" ? "dial" : "browse");
    if (m === "self") {
      setGuidedOutcomeCue(null);
      setPreferredEraFromSelf(undefined);
      setGuidedInheritAnnounce(null);
      const restore = lastSelfDecadeRef.current;
      if (restore != null) {
        // Prior Self scrub wins — stay on that decade (e.g. 1980s → Guided → 1980s).
        decadeTouched.current = true;
        pendingEraInherit.current = undefined;
        setSelfInheritAnnounce(null);
        setDecade(restore);
      } else {
        // Claim-only / no Self scrub: seed densest decade inside dial band
        // (Classic → <1990). Roast2 P1 — no teleport to densest-overall.
        decadeTouched.current = false;
        pendingEraInherit.current = guidedEraInheritRef.current;
        setDecade(null);
      }
    } else {
      // Self → Guided: decade → preferred era band (session answers still win).
      pendingEraInherit.current = undefined;
      setSelfInheritAnnounce(null);
      const d = decade ?? lastSelfDecadeRef.current;
      const band = eraBandFromDecade(d);
      setPreferredEraFromSelf(band);
      const dial = band ? eraDialShortName(band) : null;
      setGuidedInheritAnnounce(
        band != null && d != null && dial
          ? `Guided · ${dial} from ${d}s`
          : null,
      );
    }
  };

  useEffect(() => {
    widenIntentRef.current = false;
    setGuidedWiden(false);
    setGuidedHudStage("dial");
  }, [slug, mediaType]);

  // B5b: fire the world's "discover" beat whenever the user changes a discovery
  // control (search / sort / tag filter). Skipped on the initial mount run so
  // it doesn't duplicate the "open" beat. Sound-gated behind the user pref.
  useEffect(() => {
    if (firstCueRun.current) {
      firstCueRun.current = false;
      return;
    }
    if (!getSoundEnabled()) return;
    playWorldCue(world, "discover");
    // world is read from the closure; only the filter controls drive this beat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, activeTags]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["genre-experience", slug, mode, mediaType],
    queryFn: () => api.genreExperience([slug], mode, mediaType, world.modules),
    // Self↔Guided / Movies↔TV: keep prior shelf painted while the new key
    // resolves — avoids skeleton flash that reads as mode-flip jank.
    placeholderData: keepSameWorldPlaceholder(slug),
  });

  // P1.1/2.3: the curator intro is fetched separately so the rails paint
  // without waiting on the LLM. This query is non-blocking for the items.
  const { data: introData } = useQuery({
    queryKey: ["genre-intro", slug, mode, mediaType],
    queryFn: () => api.genreIntro([slug], mode, mediaType, world.modules),
    placeholderData: keepSameWorldPlaceholder(slug),
  });

  // Wave 5 seam: share GuidedTour session cache for Whisper eraBand honesty.
  const { data: guidedPayload } = useQuery({
    queryKey: ["guided-session", slug, mediaType],
    queryFn: () => api.guidedSession(slug, mediaType),
    enabled: mode === "guided",
  });
  const guidedEraChoice = resolveGuidedEraChoice({
    sessionEra: guidedPayload?.session.answers.era,
    preferredFromSelf: preferredEraFromSelf,
  });
  const guidedEraBand = eraBandLabel(guidedEraChoice);
  useEffect(() => {
    // Only real dial answers seed Guided→Self inherit — not Self preferred fallback.
    const sessionEra = guidedPayload?.session.answers.era;
    if (sessionEra) guidedEraInheritRef.current = sessionEra;
  }, [guidedPayload?.session.answers.era]);

  // Claim-as-home: Guided enter/remount with complete → Claim, not sticky Widen.
  useEffect(() => {
    const enteredGuided =
      mode === "guided" && prevModeRef.current !== "guided";
    prevModeRef.current = mode;
    if (mode !== "guided") {
      widenIntentRef.current = false;
      return;
    }
    const complete = guidedPayload?.session.status === "complete";
    if (!enteredGuided && !complete) return;
    const keep = resolveGuidedWidenOnClaimHome({
      widenIntentThisSession: widenIntentRef.current,
    });
    if (!keep) {
      setGuidedWiden(false);
      if (enteredGuided) widenIntentRef.current = false;
    }
  }, [mode, guidedPayload?.session.status]);

  const navigate = useNavigate();

  const handleOpenGuidedPick = (pick: GuidedPick) => {
    navigate(`/title/${pick.mediaType}/${pick.tmdbId}`);
  };

  // IA: search/tag/sort apply to the FULL catalog. Decade zoom is owned by
  // TimelineScrubber — do NOT decade-filter before the scrubber or the era
  // axis collapses to a single tab.
  const allItems = data?.items ?? [];

  // P3.5: "Surprise me" steering preset — a client-only shuffle of the
  // existing catalog (no server param). Toggling it re-orders `catalog`.
  const [shuffle, setShuffle] = useState(false);
  // P3.5: "Less well-known" steering preset — a client-only filter that
  // hides the well-known blockbusters (high voteAverage) so the rail surfaces
  // the lesser-known titles. No server param is added.
  const [lessKnown, setLessKnown] = useState(false);

  // Derive the toggleable genre tags from the full catalog (not decade-sliced).
  const availableTags = useMemo(() => {
    const names = new Set<string>();
    for (const it of allItems) {
      for (const gid of it.genreIds ?? []) {
        const name = genreName(gid);
        names.add(name);
      }
    }
    return [...names].sort();
  }, [allItems]);

  /** Search / tag / sort / shuffle over the full catalog (timeline axis source). */
  const catalog = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const base = allItems.filter((it) => {
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
      const out = [...base];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    }
    return base;
  }, [allItems, search, sort, activeTags, shuffle]);

  // Timeline gets catalog (all eras visible on the axis). Less-known still
  // applies so the rail matches the user's density preference.
  // Guided Widen: axis is dial era band — Classic whisper must not sit on
  // an All-eras catalog that includes Now titles.
  const timelineItems = useMemo(() => {
    const base = !lessKnown
      ? catalog
      : catalog.filter((it) => (it.voteAverage ?? 0) < 8);
    if (mode === "guided" && guidedWiden) {
      return filterItemsToEraBand(base, guidedEraChoice);
    }
    return base;
  }, [catalog, lessKnown, mode, guidedWiden, guidedEraChoice]);

  /** Widen unlock: seed scrub to preferred decade inside dial band. */
  const openGuidedWiden = () => {
    const bandItems = filterItemsToEraBand(catalog, guidedEraChoice);
    const seed =
      pickPreferredDecade(bandItems, data?.anchorsUsed) ??
      pickPreferredDecade(catalog, data?.anchorsUsed);
    if (seed != null) setDecadeUser(seed);
    widenIntentRef.current = true;
    setGuidedWiden(true);
  };

  /** Claim desk: restore band ownership — clear decade pin from Widen. */
  const collapseGuidedWiden = () => {
    widenIntentRef.current = false;
    setGuidedWiden(false);
    decadeTouched.current = false;
    setDecade(null);
  };

  // Self decade-first: derive preferred decade on the same render as catalog
  // data so cold load / Guided→Self never paint controlled null (All eras)
  // into the tray before URL state catches up. Intentional All eras
  // (decadeTouched + null) stays null — scrubber owns that summary UX.
  // Guided→Self with a dial era: prefer densest decade inside that band.
  const activeDecade: number | null =
    mode === "self" &&
    decade == null &&
    !decadeTouched.current &&
    data &&
    timelineItems.length > 0
      ? (() => {
          const eraId = pendingEraInherit.current;
          if (eraId) {
            const bandItems = filterItemsToEraBand(timelineItems, eraId);
            return (
              pickPreferredDecade(bandItems, data.anchorsUsed) ??
              pickPreferredDecade(timelineItems, data.anchorsUsed) ??
              null
            );
          }
          return pickPreferredDecade(timelineItems, data.anchorsUsed) ?? null;
        })()
      : decade;

  // Commit preferred decade into URL/localStorage (layout: before paint).
  useLayoutEffect(() => {
    if (mode !== "self") return;
    if (decadeTouched.current || decade != null) return;
    if (activeDecade == null) return;
    const eraId = pendingEraInherit.current;
    if (eraId) {
      const dial = eraDialShortName(eraId);
      if (dial) {
        setSelfInheritAnnounce(`Self · ${activeDecade}s from ${dial} dial`);
      }
      pendingEraInherit.current = undefined;
    }
    setDecade(activeDecade);
  }, [mode, decade, activeDecade]);

  const decadeItems = useMemo(() => {
    if (activeDecade == null) return allItems;
    return allItems.filter((it) => decadeOf(it.year) === activeDecade);
  }, [allItems, activeDecade]);

  // Task 5.2 (D1): a selected decade ZOOMS the world, not just filters. The
  // era thesis is deterministic — decade + metaphor + title count. No LLM
  // upgrade: title insight hooks leaked markdown and title-specific copy.
  // Decade lives on Timeline tab + URL + tray aria; thesis adds metaphor/count only.
  const deterministicEraThesis = useMemo(() => {
    if (activeDecade == null) return undefined;
    const count = decadeItems.length;
    return count === 0
      ? `${world.metaphor} territory, still open.`
      : `${count} ${count === 1 ? "title" : "titles"} in the ${world.metaphor}.`;
  }, [activeDecade, decadeItems, world.metaphor]);

  const eraThesis = deterministicEraThesis;

  // Decade zoom + less-known for featured / marathon / export (not timeline axis).
  const steered = useMemo(() => {
    const decadeScoped =
      activeDecade == null
        ? catalog
        : catalog.filter((it) => decadeOf(it.year) === activeDecade);
    if (!lessKnown) return decadeScoped;
    return decadeScoped.filter((it) => (it.voteAverage ?? 0) < 8);
  }, [catalog, activeDecade, lessKnown]);

  // B5b: fire the world's "warn" beat when the user's filters empty the
  // *rendered* rail (no titles survive search/tag/sort). We watch `steered`
  // (the actually-displayed set). Sound-gated; only after data has loaded.
  useEffect(() => {
    if (!getSoundEnabled()) return;
    if (isLoading || isError || !data) return;
    if (steered.length === 0) playWorldCue(world, "warn");
    // world/data/steered read from the closure; only the emptiness transition matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steered.length, isLoading, isError]);

  const toggleTag = (tag: string) =>
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  // Guided: preserve server rankForGuided order (rail lead = shelf lead).
  // Self: strongest rating among the current shelf — prior Self behavior.
  const featuredCandidate = useMemo(() => {
    if (!steered.length) return null;
    if (mode === "guided") return steered[0] ?? null;
    return [...steered].sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))[0] ?? null;
  }, [steered, mode]);

  useEffect(() => {
    if (!world.modules.includes("argument")) return;
    if (!featuredCandidate) {
      setLazyArguments({});
      return;
    }
    const it = featuredCandidate;
    let cancelled = false;
    // Paint a deterministic thesis immediately so Featured never waits on LLM.
    // `activeDecade` is in deps so peek→zoom always re-binds Featured to the
    // new shelf even when the same title leads both All-eras and the decade.
    const fallback = fallbackThesisFromItem(it);
    setLazyArguments({
      [it.tmdbId]: { thesis: fallback, counterpoint: null },
    });
    api
      .insight(it.mediaType, it.tmdbId, false, true)
      .then((insight) => {
        if (cancelled) return;
        const thesis =
          normalizeInsightThesis(insight?.hook ?? insight?.text, fallback) ?? fallback;
        const counter = insight?.comparisons?.[0];
        setLazyArguments({
          [it.tmdbId]: {
            thesis,
            counterpoint: counter
              ? {
                  title: stripInlineMarkdown(String(counter.title ?? "")),
                  relation: counter.relation,
                  tmdbId: counter.tmdbId,
                  mediaType: counter.mediaType,
                }
              : null,
          },
        });
      })
      .catch(() => {
        /* keep deterministic fallback already painted */
      });
    return () => {
      cancelled = true;
    };
  }, [featuredCandidate, world.modules, activeDecade]);

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

  /** Roast2 P0: collapse Featured thesis into Tonight shelf lead (claim fold). */
  const guidedLeadThesis = useMemo(() => {
    const lead = guidedPayload?.session.picks[0];
    if (!lead) return null;
    const raw = argumentsMap[lead.tmdbId]?.thesis;
    return normalizeInsightThesis(raw) ?? null;
  }, [guidedPayload?.session.picks, argumentsMap]);

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
        <CompanionPanel
          world={world}
          guided={mode === "guided"}
          mediaType={mediaType}
          tourCue={mode === "guided" ? guidedOutcomeCue : null}
          onOpenChange={setDeepenOpen}
        />
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="h-40 animate-pulse rounded-3xl bg-white/[0.04]" />
        </div>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <CompanionPanel
          world={world}
          guided={mode === "guided"}
          mediaType={mediaType}
          tourCue={mode === "guided" ? guidedOutcomeCue : null}
          onOpenChange={setDeepenOpen}
        />
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

  const visibleTags = tagsExpanded
    ? availableTags
    : availableTags.slice(0, TAG_VISIBLE);
  const hiddenTagCount = Math.max(0, availableTags.length - TAG_VISIBLE);

  const onTopicSelect = (id: number | string) => {
    const name = genreName(Number(id));
    gs.setActiveTags(toggleTagArr(name, activeTags));
  };

  const modulesShared = {
    modules: world.modules,
    items: steered,
    timelineItems,
    credibility: maps.credibility,
    watchOrder: maps.watchOrder,
    arguments: argumentsMap,
    geo: maps.geo,
    makers: maps.makers,
    selectedDecade: activeDecade,
    onDecade: setDecadeUser,
    anchors: data.anchorsUsed,
    world,
    eraThesis,
    onTopicSelect,
  } as const;

  const leavePath = (
    <>
      {mode === "self" && world.modules.includes("geo") && geoRegions.length > 0 && (
        <GeoMap regions={geoRegions} libraryCountries={libraryCountries} />
      )}

      {mode === "self" &&
        world.modules.includes("watchorder") &&
        steered.some((it) => maps.watchOrder[it.tmdbId]) && (
          <MarathonBuilder
            slug={slug}
            seasons={(steered ?? [])
              .flatMap((it) => maps.watchOrder[it.tmdbId]?.seasons ?? [])
              .map((s) => ({
                number: s.number,
                name: s.name,
                episodeCount: s.episodeCount,
                watched: s.watched,
              }))}
            watchlist={steered.map((it) => ({
              title: it.title,
              year: it.year ?? undefined,
            }))}
          />
        )}

      <div data-shuffle={shuffle ? "true" : "false"}>
        <NeighborRail world={world} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-4">
        <Link
          to="/genre#map"
          className="font-sans text-sm text-mist-300 underline-offset-4 transition-colors hover:text-mist-200 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)]"
        >
          Open vault atlas
        </Link>
        <ExportWorld
          slug={slug}
          hook={introData?.hook}
          titles={steered.map((it) => ({
            title: it.title,
            year: it.year ?? undefined,
          }))}
          annotations={steered.reduce<Record<number, string>>((acc, it, i) => {
            const a = argumentsMap[it.tmdbId];
            if (a?.thesis) acc[i] = a.thesis;
            return acc;
          }, {})}
        />
      </div>
    </>
  );

  /* W2.4: compact steer rail — Search+Sort+≤2 presets; tags behind Narrow.
     Tray/scrub must own V1 silhouette; do not re-fatten hero. */
  const steerPanel = (
    <div
      data-testid="steer-panel"
      data-steer-density="compact"
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg bg-white/[0.02] px-1.5 py-1 ring-1 ring-white/[0.07]"
    >
      <label className="flex min-w-0 flex-1 items-center sm:flex-none sm:basis-auto">
        <span className="sr-only">Search titles</span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="w-full min-w-[7rem] rounded-md bg-ink-800/80 px-2 py-1 text-xs text-mist-100 outline-none ring-1 ring-white/10 placeholder:text-mist-500 focus:ring-[var(--world-accent)]/60 sm:w-36"
        />
      </label>

      <label className="flex items-center gap-1 text-xs text-mist-300">
        <span className="sr-only">Sort</span>
        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value as "default" | "year" | "rating")
          }
          aria-label="Sort titles"
          className="rounded-md bg-ink-800/80 px-1.5 py-1 text-xs text-mist-100 outline-none ring-1 ring-white/10 focus:ring-[var(--world-accent)]/60"
        >
          <option value="default">Curated</option>
          <option value="year">Newest</option>
          <option value="rating">Top rated</option>
        </select>
      </label>

      <div
        role="group"
        aria-label="Steering presets"
        className="flex items-center gap-1"
      >
        <button
          type="button"
          data-preset="surprise"
          aria-pressed={shuffle}
          onClick={() => setShuffle((s) => !s)}
          className={`rounded-md px-2 py-1 text-2xs font-medium ring-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] ${
            shuffle
              ? "bg-[var(--world-accent,#e8b84b)]/90 text-ink-950 ring-[var(--world-accent,#e8b84b)]/50"
              : "bg-white/[0.03] text-mist-300 ring-white/10 hover:bg-white/[0.07]"
          }`}
        >
          Surprise
        </button>
        <button
          type="button"
          data-preset="less-known"
          aria-pressed={lessKnown}
          onClick={() => setLessKnown((s) => !s)}
          className={`rounded-md px-2 py-1 text-2xs font-medium ring-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] ${
            lessKnown
              ? "bg-[var(--world-accent,#e8b84b)]/90 text-ink-950 ring-[var(--world-accent,#e8b84b)]/50"
              : "bg-white/[0.03] text-mist-300 ring-white/10 hover:bg-white/[0.07]"
          }`}
        >
          Less known
        </button>
      </div>

      {availableTags.length > 0 && (
        <details className="group basis-full border-t border-white/[0.05] pt-1 open:basis-full sm:basis-auto sm:border-t-0 sm:pt-0">
          <summary className="cursor-pointer list-none text-2xs font-medium text-mist-300 marker:content-none transition-colors hover:text-mist-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1">
              Narrow
              <span className="tabular-nums text-mist-500">
                {activeTags.length > 0
                  ? `${activeTags.length}`
                  : availableTags.length}
              </span>
            </span>
          </summary>
          <div
            role="group"
            aria-label="Filter by genre"
            className="mt-1 flex flex-wrap items-center gap-1"
          >
            {visibleTags.map((tag) => {
              const on = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-md px-2 py-0.5 text-2xs font-medium ring-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] ${
                    on
                      ? "bg-[var(--world-accent,#e8b84b)]/90 text-ink-950 ring-[var(--world-accent,#e8b84b)]/50"
                      : "bg-white/[0.03] text-mist-300 ring-white/10 hover:bg-white/[0.07]"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
            {!tagsExpanded && hiddenTagCount > 0 && (
              <button
                type="button"
                onClick={() => setTagsExpanded(true)}
                className="rounded-md px-2 py-0.5 text-2xs font-medium text-mist-400 ring-1 ring-white/10 transition-colors hover:text-mist-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)]"
              >
                +{hiddenTagCount}
              </button>
            )}
          </div>
        </details>
      )}
    </div>
  );

  /** Claim V1: one lacquer stage (hero chrome + mode strip + desk). */
  const claimUnified = mode === "guided" && !guidedWiden;

  return (
    <>
      <CompanionPanel
        world={world}
        guided={mode === "guided"}
        mediaType={mediaType}
        tourCue={mode === "guided" ? guidedOutcomeCue : null}
        onOpenChange={setDeepenOpen}
      />
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
        data-experience-mode={mode}
        style={{ ["--world-accent" as any]: accentVar(world) }}
        className={`mx-auto max-w-6xl px-4 outline-none ${
          claimUnified
            ? "py-4 sm:py-5"
            : mode === "self" || guidedWiden
              ? "worlds-gap-cluster py-4 sm:py-5"
              : "worlds-gap-stage py-6 sm:py-8"
        }${
          activeDecade != null
            ? " zoomed-decade ring-1 ring-[var(--world-accent)]/30 rounded-3xl"
            : ""
        }`}
      >
        <div
          data-testid={claimUnified ? "claim-stage" : undefined}
          data-claim-unified={claimUnified ? "1" : "0"}
          className={
            claimUnified
              ? "reg-ticks relative overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-850/60"
              : "contents"
          }
        >
        <ExperienceHero
          slug={slug}
          world={world}
          anchorsUsed={data.anchorsUsed}
          profileState={data.profileState}
          titleCount={(data.items ?? []).length}
          heatItems={data.items ?? []}
          compact
          titleAs={mode === "guided" ? "eyebrow" : "display"}
          embedded={claimUnified}
        />

        <div
          data-testid="session-chrome"
          className={
            claimUnified
              ? "sticky top-0 z-20 flex flex-wrap items-center gap-2 border-y border-white/[0.06] bg-ink-950/90 px-2 py-1.5 backdrop-blur-md supports-[backdrop-filter]:bg-ink-950/75"
              : "sticky top-0 z-20 -mx-1 flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-950/85 px-2 py-1.5 backdrop-blur-md supports-[backdrop-filter]:bg-ink-950/70"
          }
        >
          <span
            className="sr-only"
            role="status"
            aria-live="polite"
            data-testid="mode-announce"
          >
            {mode === "guided"
              ? guidedInheritAnnounce ??
                (guidedWiden
                  ? guidedEraBand
                    ? `Guided. Browsing the archive · ${guidedEraBand}.`
                    : "Guided. Browsing the archive."
                  : "Guided. Claiming tonight's picks.")
              : (selfInheritAnnounce ?? "Self. Browsing by decade.")}
          </span>
          <div
            role="group"
            aria-label="Experience mode"
            className="flex items-center gap-0.5 rounded-lg bg-ink-800/90 p-0.5 ring-1 ring-white/10"
          >
            {(["self", "guided"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setModeParam(m)}
                className={`rounded-md px-2.5 py-1.5 text-2xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] ${
                  mode === m
                    ? "bg-[var(--world-accent,#e8b84b)]/90 text-ink-950"
                    : "text-mist-300 hover:text-mist-100"
                }`}
              >
                {m === "self" ? "Self" : "Guided"}
              </button>
            ))}
          </div>
          <div
            role="group"
            aria-label="Media type"
            className="flex items-center gap-0.5 rounded-lg bg-ink-800/90 p-0.5 ring-1 ring-white/10"
          >
            {(["movie", "tv"] as const).map((mt) => (
              <button
                key={mt}
                type="button"
                aria-pressed={mediaType === mt}
                onClick={() => setMediaTypeParam(mt)}
                className={`rounded-md px-2.5 py-1.5 text-2xs font-medium capitalize transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--world-accent,#e8b84b)] ${
                  mediaType === mt
                    ? "bg-white/12 text-mist-50 ring-1 ring-white/20"
                    : "text-mist-300 hover:text-mist-100"
                }`}
              >
                {mt === "movie" ? "Movies" : "TV"}
              </button>
            ))}
          </div>
          {/* Stage announce is sr-only booth voice — no packing jargon (cockpit/tray/instrument). */}
        </div>

        {/* Mode-split B seam: remount stage tree on Self↔Guided. Motion is
            CSS-only (.mode-stage) and gated by prefers-reduced-motion. */}
        <div
          key={mode}
          data-testid="mode-stage"
          data-mode-stage={mode}
          className={
            claimUnified
              ? "mode-stage"
              : guidedWiden || mode === "self"
                ? "mode-stage worlds-gap-cluster"
                : "mode-stage worlds-gap-stage"
          }
        >
          {mode === "guided" ? (
            <>
              <GuidedTour
                slug={slug}
                mediaType={mediaType}
                world={world}
                isSeedWorld={isNiche}
                compact={guidedWiden}
                embedded={claimUnified}
                eraBand={guidedEraBand}
                preferredEraBand={preferredEraFromSelf ?? null}
                deepenOpen={deepenOpen}
                onWiden={openGuidedWiden}
                onCollapseWiden={collapseGuidedWiden}
                onStageChange={setGuidedHudStage}
                onSteerEra={setDecadeUser}
                onOpenTitle={handleOpenGuidedPick}
                onOutcomeCue={setGuidedOutcomeCue}
                leadThesis={guidedLeadThesis}
              >
                {!isNiche &&
                  !guidedWiden &&
                  guidedHudStage === "deepen" && (
                    <GenreModules
                      {...modulesShared}
                      stage="claim"
                      preferGuidedFeatured
                    />
                  )}
              </GuidedTour>

              {/* Claim keeps whisper; Widen status bar owns cue (no Claim+append). */}
              {!guidedWiden && (
                <div
                  data-testid="guided-page-outcome"
                  data-guided-live={guidedOutcomeCue ? "1" : "0"}
                  className={
                    guidedOutcomeCue
                      ? `world-accent-cue rounded-lg px-1 py-0.5 transition-[box-shadow,opacity] duration-300${
                          claimUnified ? " mx-2 mb-2 mt-1" : ""
                        }`
                      : claimUnified
                        ? "border-t border-white/[0.06] px-4 py-2"
                        : undefined
                  }
                >
                  <WhisperStrip
                    decade={activeDecade}
                    anchorCount={(data.anchorsUsed ?? []).length}
                    unwatched={data.items.filter((it) => !it.inLibrary).length}
                    guided
                    guidedCue={guidedOutcomeCue}
                    guidedStage={guidedHudStage}
                    eraBand={guidedEraBand}
                  />
                </div>
              )}

              {isNiche ? (
                <GenreEmptyState
                  world={world}
                  count={data.items.length}
                  threshold={NICHE_THRESHOLD}
                  mediaType={mediaType}
                  onBootstrap={() => navigate("/library")}
                  excludeKeys={data.items.map(
                    (it) => `${it.mediaType}:${it.tmdbId}`,
                  )}
                />
              ) : guidedWiden ? (
                <div
                  data-testid="guided-browse-tray"
                  data-guided-pack="browse-stage"
                  className="worlds-gap-cluster"
                >
                  {/* Roast2: Guided widen = tray only — no Self steer warehouse. */}
                  <GenreModules
                    {...modulesShared}
                    stage="browse"
                    preferGuidedFeatured
                  />
                  {leavePath}
                </div>
              ) : null}
            </>
          ) : (
            <>
              {isNiche ? (
                <GenreEmptyState
                  world={world}
                  count={data.items.length}
                  threshold={NICHE_THRESHOLD}
                  mediaType={mediaType}
                  onBootstrap={() => navigate("/library")}
                  excludeKeys={data.items.map(
                    (it) => `${it.mediaType}:${it.tmdbId}`,
                  )}
                />
              ) : (
                <div data-testid="self-browse-stage" className="worlds-gap-cluster">
                  <div
                    data-testid="guided-page-outcome"
                    data-guided-live="0"
                    className="min-h-0"
                  >
                    <WhisperStrip
                      decade={activeDecade}
                      anchorCount={(data.anchorsUsed ?? []).length}
                      unwatched={data.items.filter((it) => !it.inLibrary).length}
                      guided={false}
                      guidedCue={null}
                    />
                  </div>
                  {steerPanel}
                  <div className="min-w-0">
                    <GenreModules
                      {...modulesShared}
                      stage="full"
                      preferGuidedFeatured={false}
                    />
                  </div>
                  {leavePath}
                </div>
              )}
            </>
          )}
        </div>
        </div>
      </main>
    </>
  );
}
