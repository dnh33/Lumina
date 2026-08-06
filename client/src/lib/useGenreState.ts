import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GENRE_STATE_KEY } from "./keys.js";

export type GenreSort = "default" | "year" | "rating";
export type GenreMode = "self" | "guided";
export type GenreMediaType = "movie" | "tv";

export interface GenreSteer {
  mode: GenreMode;
  mediaType: GenreMediaType;
}

interface ScrubState {
  decade: number | null;
  search: string;
  sort: GenreSort;
  tags: string[];
}

interface PersistedBlob {
  scrub: ScrubState;
  steer: GenreSteer;
  dismissed: string[];
}

const DEFAULT_STEER: GenreSteer = { mode: "self", mediaType: "movie" };

function storageKey(slug: string): string {
  return `${GENRE_STATE_KEY}:${slug}`;
}

function loadBlob(slug: string): PersistedBlob | null {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedBlob>;
    return {
      scrub: {
        decade: parsed.scrub?.decade ?? null,
        search: parsed.scrub?.search ?? "",
        sort: parsed.scrub?.sort ?? "default",
        tags: parsed.scrub?.tags ?? [],
      },
      steer: parsed.steer ?? DEFAULT_STEER,
      dismissed: parsed.dismissed ?? [],
    };
  } catch {
    return null;
  }
}

function decadeToParam(d: number | null): string | null {
  return d == null ? null : `${d}s`;
}

function paramToDecade(s: string | null): number | null {
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Single source of truth for a genre world's exploration state (Task 4.4 /
 * B4). Filter state (decade / search / sort / tags) is URL-addressable — it is
 * read from the query string on mount and written back (replace, not push) on
 * change. The full world state — the filter scrub plus steer (mode/mediaType)
 * and the dismissed title set — is persisted to localStorage under
 * `${GENRE_STATE_KEY}:${slug}` so a reload or deep link restores it.
 *
 * On mount: URL params win if any filter param is present; otherwise a
 * previously persisted localStorage blob is used as fallback; otherwise
 * defaults. Steer + dismissed are always sourced from localStorage (never the
 * URL), keeping deep links tidy.
 */
export function useGenreState(slug: string) {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlHasFilter =
    searchParams.has("decade") ||
    searchParams.has("q") ||
    searchParams.has("sort") ||
    searchParams.has("tags");

  const persisted = loadBlob(slug);

  const [decade, setDecade] = useState<number | null>(() => {
    if (urlHasFilter) return paramToDecade(searchParams.get("decade"));
    return persisted?.scrub.decade ?? null;
  });
  const [search, setSearch] = useState<string>(() => {
    if (urlHasFilter) return searchParams.get("q") ?? "";
    return persisted?.scrub.search ?? "";
  });
  const [sort, setSort] = useState<GenreSort>(() => {
    if (urlHasFilter) {
      const s = searchParams.get("sort");
      return s === "year" || s === "rating" ? s : "default";
    }
    return persisted?.scrub.sort ?? "default";
  });
  const [activeTags, setActiveTagsState] = useState<string[]>(() => {
    if (urlHasFilter) {
      const t = searchParams.get("tags");
      return t ? t.split(",").filter(Boolean) : [];
    }
    return persisted?.scrub.tags ?? [];
  });

  const [steer, setSteer] = useState<GenreSteer>(() => {
    // N4 (deep-link mediaType): a `?mediaType=tv` share link must start in TV
    // mode WITHOUT a post-mount setState flash, so read the URL param into the
    // initial steer synchronously. The URL wins over a persisted localStorage
    // blob; the page's toggle keeps both steer + URL in sync afterwards.
    // Mode: URL explicit only. Hub Enter / bare `/genre/:slug` = Self cold
    // browse — never silently resume Guided from localStorage (roast2 P1).
    const urlMt = searchParams.get("mediaType");
    const urlMode = searchParams.get("mode");
    let next: GenreSteer = {
      mode: "self",
      mediaType: persisted?.steer.mediaType ?? DEFAULT_STEER.mediaType,
    };
    if (urlMt === "tv" || urlMt === "movie") next = { ...next, mediaType: urlMt };
    if (urlMode === "guided" || urlMode === "self") next = { ...next, mode: urlMode };
    return next;
  });
  const [dismissed, setDismissed] = useState<string[]>(
    () => persisted?.dismissed ?? [],
  );

  // Sync the URL (replace, not push) from the latest filter + steer state.
  // Rebuild from state — do NOT clone searchParams. Cloning raced with
  // GenreExperience setModeParam/setMediaTypeParam and could drop
  // `mode=guided` when decade/scrub wrote, flipping the tour off mid-session.
  useEffect(() => {
    const params = new URLSearchParams();
    const dec = decadeToParam(decade);
    if (dec) params.set("decade", dec);
    if (search) params.set("q", search);
    if (sort && sort !== "default") params.set("sort", sort);
    if (activeTags.length) params.set("tags", activeTags.join(","));
    if (steer.mode === "guided") params.set("mode", "guided");
    if (steer.mediaType === "tv") params.set("mediaType", "tv");
    setSearchParams(params, { replace: true });
  }, [decade, search, sort, activeTags, steer.mode, steer.mediaType, setSearchParams]);

  const setActiveTags = (
    tags: string[] | ((prev: string[]) => string[]),
  ) => setActiveTagsState(tags);

  const dismiss = (tmdbId: number) => {
    setDismissed((prev) =>
      prev.includes(String(tmdbId)) ? prev : [...prev, String(tmdbId)],
    );
  };

  // Persist the full world state to localStorage on any change.
  useEffect(() => {
    const blob: PersistedBlob = {
      scrub: { decade, search, sort, tags: activeTags },
      steer,
      dismissed,
    };
    try {
      localStorage.setItem(storageKey(slug), JSON.stringify(blob));
    } catch {
      // storage full / unavailable — non-fatal for in-session UX.
    }
  }, [slug, decade, search, sort, activeTags, steer, dismissed]);

  return {
    decade,
    setDecade,
    search,
    setSearch,
    sort,
    setSort,
    activeTags,
    setActiveTags,
    steer,
    setSteer,
    dismissed,
    dismiss,
  };
}

export { GENRE_STATE_KEY };
