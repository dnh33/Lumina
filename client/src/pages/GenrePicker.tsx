import { useMemo, type ReactNode } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import {
  GENRE_WORLDS,
  getGenreWorld,
  MOOD_TO_SLUGS,
  type GenreWorld,
} from "../lib/genreWorld.js";
import type { Genre } from "../lib/types.js";
import { accentVar } from "../lib/metaphor.js";
import { WorldsMap } from "../components/genre/WorldsMap.js";
import { HeroAtmosphere } from "../components/genre/HeroAtmosphere.js";
import {
  genreGuidedResumePath,
  genreSelfEnterPath,
  hasGuidedSessionProgress,
} from "../components/genre/guidedStage.js";
import {
  SHELF_STATUS_COPY,
  shelfCountForSlug,
  shelfCountLabel,
  shelfStatusAria,
  shelfStatusFromCount,
  slugifyGenreName,
  type ShelfStatus,
} from "../lib/worldShelfStatus.js";

/** Alias slugs stay routable but must not appear as a second atlas door. */
const ALIAS_SLUGS = new Set(["sci-fi"]);

/** Curated worlds shown on the hub atlas (one door per world). */
const ATLAS_SLUGS = Object.keys(GENRE_WORLDS).filter((s) => !ALIAS_SLUGS.has(s));

/**
 * High-signal mood doors only (Wave 3 soup quarantine).
 * Full register stays in genreWorld data; hub mood panel ≤8 chips.
 */
const HUB_MOODS = [
  "dread",
  "uneasy",
  "wondrous",
  "contemplative",
  "tender",
  "restless",
  "playful",
  "curious",
] as const;

type HubPanel = "doors" | "map" | "mood" | "archive";

const HUB_PANELS: { id: HubPanel; label: string }[] = [
  { id: "doors", label: "Doors" },
  { id: "map", label: "Map" },
  { id: "mood", label: "Mood" },
  { id: "archive", label: "Archive" },
];

function parseHubPanel(raw: string | null): HubPanel {
  if (raw === "map" || raw === "mood" || raw === "archive" || raw === "doors") {
    return raw;
  }
  return "doors";
}

function slugify(name: string): string {
  return slugifyGenreName(name);
}

function displayName(slug: string): string {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function StatusDot({ status }: { status: ShelfStatus }) {
  // Hub gold ration: legend dots mist; Enter keeps sole gold fuel.
  const tone =
    status === "filled"
      ? "bg-mist-200 shadow-[0_0_6px_rgba(210,210,220,0.35)]"
      : status === "sparse"
        ? "bg-mist-300/80"
        : "bg-transparent ring-1 ring-white/25";
  return <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full ${tone}`} />;
}

/** Slim booth chrome - brand + one legend. Panels switch below. */
function HubChrome({
  filled,
  sparse,
  empty,
}: {
  filled: number;
  sparse: number;
  empty: number;
}) {
  return (
    <header className="reg-ticks relative overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-850/70 px-5 py-4 sm:px-6 sm:py-5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_8%_0%,rgba(232,184,75,0.07),transparent_50%),radial-gradient(ellipse_at_92%_100%,rgba(255,255,255,0.03),transparent_45%)]"
      />
      {/* Dust + constellation atmosphere - packing kept chrome; craft restores life. */}
      <HeroAtmosphere
        constellationAccent="#e8b84b"
        grainClassName="film-grain opacity-60"
      />
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold tracking-tight text-mist-100 sm:text-2xl">
            Worlds
          </h1>
          <p className="mt-1 max-w-md font-sans text-sm text-mist-300">
            Shelf heat from your vault - every room still curates a catalog.
          </p>
        </div>
        <ul
          className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-mist-300"
          aria-label="Shelf status legend"
        >
          <li className="inline-flex items-center gap-2">
            <StatusDot status="filled" />
            <span>
              Dense shelf <span className="text-mist-300">· {filled}</span>
            </span>
          </li>
          <li className="inline-flex items-center gap-2">
            <StatusDot status="sparse" />
            <span>
              Thin shelf <span className="text-mist-300">· {sparse}</span>
            </span>
          </li>
          <li className="inline-flex items-center gap-2">
            <StatusDot status="empty" />
            <span>
              No shelf <span className="text-mist-300">· {empty}</span>
            </span>
          </li>
        </ul>
      </div>
    </header>
  );
}

/** Central panel switch - one surface visible; default Doors. */
function HubTabs({
  active,
  onChange,
  archiveCount,
}: {
  active: HubPanel;
  onChange: (panel: HubPanel) => void;
  archiveCount: number;
}) {
  return (
    <div
      role="tablist"
      aria-label="Worlds hub panels"
      className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-ink-850/50 p-1"
    >
      {HUB_PANELS.map((tab) => {
        const selected = active === tab.id;
        const label =
          tab.id === "archive" && archiveCount > 0
            ? `${tab.label} (${archiveCount})`
            : tab.label;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`hub-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`hub-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`min-h-11 cursor-pointer rounded-lg px-3.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400/60 ${
              selected
                ? "bg-white/[0.08] text-mist-100 shadow-[inset_0_0_0_1px_rgba(232,184,75,0.28)]"
                : "text-mist-300 hover:bg-white/[0.04] hover:text-mist-100"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function HubPanelShell({
  id,
  active,
  labelledBy,
  children,
}: {
  id: HubPanel;
  active: HubPanel;
  labelledBy: string;
  children: ReactNode;
}) {
  if (id !== active) return null;
  return (
    <div
      role="tabpanel"
      id={`hub-panel-${id}`}
      aria-labelledby={labelledBy}
      className="min-w-0"
    >
      {children}
    </div>
  );
}

/**
 * Door card - restored from pre-Wave-3 WorldDoor.
 * Enter stays Self (stretched link); Resume tour is an explicit mist chip.
 */
function WorldDoor({
  slug,
  world,
  count,
  status,
  index,
  hasGuidedSession,
}: {
  slug: string;
  world: GenreWorld;
  count: number;
  status: ShelfStatus;
  index: number;
  hasGuidedSession: boolean;
}) {
  const accent = accentVar(world);
  const name = displayName(slug);
  const countLabel = shelfCountLabel(count);

  return (
    <div
      style={{
        ["--world-accent" as string]: accent,
        animationDelay: `${Math.min(index, 12) * 40}ms`,
      }}
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-ink-850/50 p-4 transition-[border-color,background-color,transform,opacity] duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--world-accent)_45%,transparent)] hover:bg-ink-850/80 motion-safe:animate-rise motion-reduce:animate-none motion-reduce:transform-none ${
        status === "empty" ? "opacity-75 hover:opacity-100" : ""
      }`}
    >
      <Link
        to={genreSelfEnterPath(slug)}
        aria-label={`${name} world - ${shelfStatusAria(status, count)}`}
        data-testid={`enter-${slug}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400/60"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, color-mix(in oklab, ${accent} 14%, transparent), transparent 55%)`,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-2.5 left-0 z-[1] w-px bg-[var(--world-accent)] opacity-40 transition-opacity duration-300 group-hover:opacity-90"
      />
      <div className="pointer-events-none relative z-10 flex items-start justify-between gap-3 pl-2">
        <p className="text-[11px] tracking-tight text-mist-300">{world.metaphor}</p>
        <span className="inline-flex items-center gap-1.5 text-[11px] tracking-tight text-mist-300">
          <StatusDot status={status} />
          {SHELF_STATUS_COPY[status]}
        </span>
      </div>
      <p className="pointer-events-none relative z-10 mt-1.5 pl-2 font-display text-lg font-semibold tracking-tight text-mist-100 transition-colors group-hover:text-white">
        {name}
      </p>
      <p className="pointer-events-none relative z-10 mt-1.5 flex-1 pl-2 text-sm leading-snug text-mist-300">
        {world.register.tonePrompt}
      </p>
      <div className="relative z-10 mt-3 flex items-center justify-between gap-2 border-t border-white/[0.05] pt-2.5 pl-2 text-xs text-mist-300">
        <span className="pointer-events-none">{countLabel}</span>
        <span className="inline-flex items-center gap-2">
          {hasGuidedSession ? (
            <Link
              to={genreGuidedResumePath(slug)}
              data-testid={`resume-tour-${slug}`}
              aria-label={`Resume ${name} guided tour`}
              className="pointer-events-auto inline-flex min-h-8 items-center rounded-md border border-white/[0.1] bg-white/[0.03] px-2 text-[11px] text-mist-200 transition-[border-color,background-color,color] duration-200 hover:border-white/20 hover:bg-white/[0.06] hover:text-mist-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400/60"
            >
              Resume tour
            </Link>
          ) : null}
          <span className="pointer-events-none text-mist-300 transition-colors duration-200 group-hover:text-gold-400 group-focus-within:text-gold-400">
            Enter →
          </span>
        </span>
      </div>
    </div>
  );
}

function MoodChips() {
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Mood doors">
      {HUB_MOODS.map((mood) => {
        const slugs = MOOD_TO_SLUGS[mood];
        if (!slugs || slugs.length === 0) return null;
        const target = slugs[0];
        return (
          <div key={mood} role="listitem">
            <Link
              to={genreSelfEnterPath(target)}
              aria-label={`Enter ${displayName(target)} through ${mood}`}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 text-sm capitalize text-mist-200 transition-[color,border-color,background-color] duration-200 hover:border-white/20 hover:bg-white/[0.05] hover:text-mist-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400/60"
            >
              {mood}
              <span className="ml-2 text-xs normal-case text-mist-300">
                {displayName(target)}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export default function GenrePicker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const panel = parseHubPanel(searchParams.get("tab"));

  function setPanel(next: HubPanel) {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (next === "doors") sp.delete("tab");
        else sp.set("tab", next);
        return sp;
      },
      { replace: true },
    );
  }

  const { data: genres } = useQuery({
    queryKey: ["genres"],
    queryFn: () => api.genres(),
  });

  const { data: library } = useQuery({
    queryKey: ["library"],
    queryFn: () => api.library(),
  });

  /** Minimal per-world guided peek — Resume chip only when progress exists. */
  const guidedSessionQueries = useQueries({
    queries: ATLAS_SLUGS.map((slug) => ({
      queryKey: ["guided-session", slug, "movie"] as const,
      queryFn: () => api.guidedSession(slug, "movie"),
      staleTime: 60_000,
    })),
  });

  const guidedResumeBySlug: Record<string, boolean> = {};
  for (let i = 0; i < ATLAS_SLUGS.length; i++) {
    const session = guidedSessionQueries[i]?.data?.session;
    guidedResumeBySlug[ATLAS_SLUGS[i]] = session
      ? hasGuidedSessionProgress(session)
      : false;
  }

  const atlas = useMemo(() => {
    const entries = library ?? [];
    const rank: Record<ShelfStatus, number> = { filled: 0, sparse: 1, empty: 2 };
    return ATLAS_SLUGS.map((slug) => {
      const world = getGenreWorld(slug);
      const count = shelfCountForSlug(entries, slug);
      return { slug, world, count, status: shelfStatusFromCount(count) };
    }).sort((a, b) => rank[a.status] - rank[b.status] || b.count - a.count);
  }, [library]);

  const statusTotals = useMemo(() => {
    const totals = { filled: 0, sparse: 0, empty: 0 };
    for (const w of atlas) totals[w.status] += 1;
    return totals;
  }, [atlas]);

  /** Lead the map on the densest shelf world - Enter is useful on cold load. */
  const leadSlug = useMemo(() => {
    const filled = atlas.find((w) => w.status === "filled");
    if (filled) return filled.slug;
    const sparse = atlas.find((w) => w.status === "sparse");
    return sparse?.slug ?? ATLAS_SLUGS[0] ?? "documentary";
  }, [atlas]);

  const rest: Genre[] = (genres ?? []).filter((g) => {
    const s = slugify(g.name);
    if (ATLAS_SLUGS.includes(s) || ALIAS_SLUGS.has(s)) return false;
    if (s === "science-fiction" || s === "sci-fi") return false;
    return true;
  });

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden px-4 py-5 sm:py-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(232,184,75,0.06),transparent_55%),radial-gradient(ellipse_at_90%_20%,rgba(255,255,255,0.03),transparent_45%)]" />
      </div>
      <div className="relative z-10 worlds-gap-stage">
        <div className="worlds-gap-cluster">
          <HubChrome
            filled={statusTotals.filled}
            sparse={statusTotals.sparse}
            empty={statusTotals.empty}
          />

          <HubTabs
            active={panel}
            onChange={setPanel}
            archiveCount={rest.length}
          />
        </div>

        <HubPanelShell id="doors" active={panel} labelledBy="hub-tab-doors">
          <section aria-label="Door list">
            <p className="mb-3 max-w-xl text-sm text-mist-300">
              Curated rooms - tone first, enter from the card.
            </p>
            <div
              className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label="Door list"
            >
              {atlas.map((door, i) => (
                <div key={door.slug} role="listitem">
                  <WorldDoor
                    slug={door.slug}
                    world={door.world}
                    count={door.count}
                    status={door.status}
                    index={i}
                    hasGuidedSession={!!guidedResumeBySlug[door.slug]}
                  />
                </div>
              ))}
            </div>
          </section>
        </HubPanelShell>

        <HubPanelShell id="map" active={panel} labelledBy="hub-tab-map">
          <section id="map" aria-label="Worlds territory map" className="scroll-mt-4">
            <p className="mb-3 max-w-xl text-sm text-mist-300">
              Territory view - focus a room, then Enter or warp.
            </p>
            <WorldsMap
              key={library ? `hub-${leadSlug}` : "hub-pending"}
              variant="hub"
              defaultFocus={leadSlug}
              guidedResumeBySlug={guidedResumeBySlug}
            />
          </section>
        </HubPanelShell>

        <HubPanelShell id="mood" active={panel} labelledBy="hub-tab-mood">
          <section aria-label="Browse by mood">
            <p className="mb-3 max-w-xl text-sm text-mist-300">
              Eight high-signal feelings - each opens the world that owns it.
            </p>
            <MoodChips />
          </section>
        </HubPanelShell>

        <HubPanelShell id="archive" active={panel} labelledBy="hub-tab-archive">
          {rest.length > 0 ? (
            <section aria-label="Archive genres">
              <p className="mb-3 max-w-xl text-sm text-mist-300">
                Remaining TMDB genres - thinner metaphors, still enterable.
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="list"
                aria-label="Archive genres"
              >
                {rest.map((g) => (
                  <div key={g.id} role="listitem">
                    <Link
                      to={genreSelfEnterPath(slugify(g.name))}
                      className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-white/[0.06] px-3 text-sm text-mist-300 transition-colors hover:border-white/15 hover:text-mist-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400/60"
                    >
                      {g.name}
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <p className="text-sm text-mist-300">No archive leftovers.</p>
          )}
        </HubPanelShell>
      </div>
    </div>
  );
}
