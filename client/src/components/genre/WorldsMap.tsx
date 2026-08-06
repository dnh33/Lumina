import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SectionHead } from "./SectionHead.js";
import { api } from "../../lib/api.js";
import {
  GENRE_WORLDS,
  getGenreWorld,
  type GenreWorld,
} from "../../lib/genreWorld.js";
import { accentVar } from "../../lib/metaphor.js";
import {
  SHELF_STATUS_COPY,
  shelfCountForSlug,
  shelfStatusAria,
  shelfStatusDetail,
  shelfStatusFromCount,
  type ShelfStatus,
} from "../../lib/worldShelfStatus.js";
import { genreGuidedResumePath, genreSelfEnterPath } from "./guidedStage.js";

/** Alias stays routable; never a second map node. */
const ALIAS_SLUGS = new Set(["sci-fi"]);

type Metaphor = GenreWorld["metaphor"];

/** Atlas canvas — cinema floor-plan proportions. */
const VIEW_W = 1000;
const VIEW_H = 620;

/**
 * Baseline hit radius in map units. Live radius is floored via ResizeObserver
 * so CSS diameter stays ≥44px at any hub map height. Enter strip stays primary.
 */
const MARKER_HIT_R_MIN = 30;
/** Half of WCAG / Pro Max touch floor (44 CSS px). */
const HIT_CSS_HALF_PX = 22;

/**
 * Hand-placed territory polygons (metaphor landmasses).
 * Coordinates are map space — kinship neighborhoods, not clock order.
 */
const TERRITORIES: {
  metaphor: Metaphor;
  path: string;
  label: { x: number; y: number };
  fill: string;
}[] = [
  {
    metaphor: "Reading Room",
    path: "M48 42 L318 36 L340 188 L210 228 L52 198 Z",
    label: { x: 168, y: 58 },
    fill: "rgba(100, 116, 139, 0.14)",
  },
  {
    metaphor: "Constellation",
    path: "M560 40 L940 48 L928 210 L700 236 L548 168 Z",
    label: { x: 740, y: 62 },
    /* Warm projection mist — not indigo/purple SaaS */
    fill: "rgba(186, 168, 140, 0.11)",
  },
  {
    metaphor: "Threshold",
    path: "M40 230 L360 210 L390 400 L200 448 L48 390 Z",
    label: { x: 168, y: 248 },
    fill: "rgba(239, 68, 68, 0.10)",
  },
  {
    metaphor: "Panel",
    path: "M620 250 L960 230 L952 430 L700 458 L600 360 Z",
    label: { x: 790, y: 268 },
    fill: "rgba(16, 185, 129, 0.10)",
  },
  {
    metaphor: "Warm Interior",
    path: "M56 460 L380 440 L400 590 L70 588 Z",
    label: { x: 180, y: 476 },
    fill: "rgba(245, 158, 11, 0.11)",
  },
  {
    metaphor: "Frontier",
    path: "M560 470 L940 450 L948 590 L580 588 Z",
    label: { x: 740, y: 488 },
    fill: "rgba(45, 212, 191, 0.10)",
  },
];

/** Node anchors inside territories — readable labels, kinship spacing. */
const NODE_POS: Record<string, { x: number; y: number }> = {
  documentary: { x: 150, y: 118 },
  "war-politics": { x: 268, y: 108 },
  history: { x: 210, y: 178 },
  "science-fiction": { x: 680, y: 118 },
  fantasy: { x: 820, y: 148 },
  horror: { x: 150, y: 310 },
  thriller: { x: 280, y: 278 },
  "film-noir": { x: 250, y: 378 },
  anime: { x: 780, y: 310 },
  crime: { x: 690, y: 348 },
  mystery: { x: 860, y: 368 },
  music: { x: 740, y: 418 },
  romance: { x: 160, y: 530 },
  comedy: { x: 300, y: 548 },
  western: { x: 680, y: 530 },
  travel: { x: 840, y: 548 },
};

const ATLAS_SLUGS = Object.keys(GENRE_WORLDS).filter((s) => !ALIAS_SLUGS.has(s));

function displayName(slug: string): string {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function canonicalizeSlug(slug: string): string {
  return slug === "sci-fi" ? "science-fiction" : slug;
}

function StatusDot({ status }: { status: ShelfStatus }) {
  // Hub gold ration: filled = mist fill (not gold fuel). Shell Worlds keeps brand gold.
  const tone =
    status === "filled"
      ? "bg-mist-200 shadow-[0_0_6px_rgba(210,210,220,0.35)]"
      : status === "sparse"
        ? "bg-mist-300/80"
        : "bg-transparent ring-1 ring-white/25";
  return <span aria-hidden className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${tone}`} />;
}

interface MapWorld {
  slug: string;
  world: GenreWorld;
  count: number;
  status: ShelfStatus;
  x: number;
  y: number;
}

interface WorldsMapProps {
  /** When mounted inside a world, pre-focus that room. */
  currentSlug?: string;
  /**
   * Hub cold-load focus without marking aria-current (densest shelf world).
   * Ignored when currentSlug is set.
   */
  defaultFocus?: string;
  /** Skip section head when a parent already labels the map (in-genre details). */
  embedded?: boolean;
  /**
   * Hub primary surface: no peer "Map" heading / duplicate legend;
   * denser fold packing so Enter stays in the first viewport.
   */
  variant?: "standalone" | "hub";
  /** Per-slug Guided progress — mist Resume chip; value is resume mediaType. */
  guidedResumeBySlug?: Record<string, "movie" | "tv" | undefined>;
}

function resolveFocusSlug(slug: string | undefined): string | null {
  if (!slug) return null;
  if (ALIAS_SLUGS.has(slug)) return slug === "sci-fi" ? "science-fiction" : null;
  return slug;
}

/**
 * Territory atlas — library shelf heat + kinship on a spatial map.
 *
 * Status is shelf coverage only; a cold shelf still opens a curated catalog.
 * Job: regions you can read as geography, shelf status at a glance, enter or
 * warp in ≤2 clicks. Not pill clouds. Not decorative constellation spaghetti.
 */
export function WorldsMap({
  currentSlug,
  defaultFocus,
  embedded = false,
  variant = "standalone",
  guidedResumeBySlug,
}: WorldsMapProps = {}) {
  const navigate = useNavigate();
  const isHub = variant === "hub";
  const svgRef = useRef<SVGSVGElement>(null);
  /** ViewBox hit radius — grows when SVG shrinks so CSS diam ≥44. */
  const [hitR, setHitR] = useState(MARKER_HIT_R_MIN);
  const initialFocus =
    resolveFocusSlug(currentSlug) ??
    resolveFocusSlug(defaultFocus) ??
    ATLAS_SLUGS[0] ??
    null;

  const [focused, setFocused] = useState<string | null>(initialFocus);
  /** DOM focus (keyboard/Tab) — drives WCAG 2.4.7 halo; separate from hover selection. */
  const [domFocus, setDomFocus] = useState<string | null>(null);

  // W2.5: CSS-px floor — viewBox-r alone scales under meet; bump r when compact.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const scale = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
      if (scale <= 0) return;
      const need = HIT_CSS_HALF_PX / scale;
      setHitR(Math.max(MARKER_HIT_R_MIN, need));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { data: library } = useQuery({
    queryKey: ["library"],
    queryFn: () => api.library(),
  });

  const atlas = useMemo((): MapWorld[] => {
    const entries = library ?? [];
    return ATLAS_SLUGS.map((slug) => {
      const world = getGenreWorld(slug);
      const count = shelfCountForSlug(entries, slug);
      const pos = NODE_POS[slug] ?? { x: 500, y: 310 };
      return {
        slug,
        world,
        count,
        status: shelfStatusFromCount(count),
        x: pos.x,
        y: pos.y,
      };
    });
  }, [library]);

  const bySlug = useMemo(() => {
    const m = new Map<string, MapWorld>();
    for (const w of atlas) m.set(w.slug, w);
    return m;
  }, [atlas]);

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: { a: string; b: string }[] = [];
    for (const w of atlas) {
      for (const raw of w.world.register.adjacency ?? []) {
        const n = canonicalizeSlug(raw);
        if (!bySlug.has(n)) continue;
        const key = [w.slug, n].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ a: w.slug, b: n });
      }
    }
    return list;
  }, [atlas, bySlug]);

  const totals = useMemo(() => {
    const t = { filled: 0, sparse: 0, empty: 0 };
    for (const w of atlas) t[w.status] += 1;
    return t;
  }, [atlas]);

  const active = focused ? bySlug.get(focused) : undefined;
  const neighborSet = useMemo(() => {
    if (!active) return new Set<string>();
    return new Set(
      (active.world.register.adjacency ?? []).map(canonicalizeSlug).filter((s) => bySlug.has(s)),
    );
  }, [active, bySlug]);

  const neighborTargets = [...neighborSet];
  const hideChrome = embedded || isHub;

  return (
    <div
      className={`relative overflow-hidden border border-white/[0.06] bg-ink-850/60 ${
        isHub
          ? "rounded-2xl p-3 sm:p-4"
          : "rounded-2xl p-4 sm:p-5"
      }`}
      data-testid="worlds-map"
      data-variant={variant}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(232,184,75,0.06),transparent_48%),radial-gradient(ellipse_at_88%_100%,rgba(45,212,191,0.04),transparent_42%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative">
        {!hideChrome && (
          <>
            <SectionHead id="worlds-map-heading">Map</SectionHead>
            <p className="mb-4 max-w-xl text-sm text-mist-300">
              Territories of the vault. Status is your library shelf — not the
              curated catalog. Lines are warps. Click a world to enter.
            </p>
          </>
        )}

        {!isHub && (
          <ul
            className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-mist-300"
            aria-label="Shelf status legend"
          >
            <li className="inline-flex items-center gap-2">
              <StatusDot status="filled" />
              <span>
                Dense shelf{" "}
                <span className="text-mist-300">· {totals.filled}</span>
              </span>
            </li>
            <li className="inline-flex items-center gap-2">
              <StatusDot status="sparse" />
              <span>
                Thin shelf{" "}
                <span className="text-mist-300">· {totals.sparse}</span>
              </span>
            </li>
            <li className="inline-flex items-center gap-2">
              <StatusDot status="empty" />
              <span>
                No shelf{" "}
                <span className="text-mist-300">· {totals.empty}</span>
              </span>
            </li>
          </ul>
        )}

        {active && (
          <FocusStrip
            world={active}
            neighbors={neighborTargets}
            bySlug={bySlug}
            compact={isHub}
            canResume={!!guidedResumeBySlug?.[active.slug]}
            resumeMediaType={guidedResumeBySlug?.[active.slug]}
          />
        )}

        <div
          className={`relative overflow-hidden rounded-xl border border-white/[0.07] bg-ink-900/50 ${
            isHub ? "mt-3" : "mt-4"
          }`}
          data-testid="map-atlas"
          role="group"
          aria-label={
            hideChrome
              ? "World markers - tab to a territory, Enter to open"
              : undefined
          }
          aria-labelledby={!hideChrome ? "worlds-map-heading" : undefined}
        >
          {/* Meridian / parallel hairlines — cartographic cue.
              No role="img": markers are real links; img would hide them from AT. */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="xMidYMid meet"
            className={`block w-full ${
              isHub
                ? "h-[min(56vh,460px)]"
                : "h-auto"
            }`}
          >
            <defs>
              <pattern
                id="map-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M40 0 H0 V40"
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            <rect width={VIEW_W} height={VIEW_H} fill="url(#map-grid)" />

            {/* Coastline frame */}
            <rect
              x="18"
              y="18"
              width={VIEW_W - 36}
              height={VIEW_H - 36}
              rx="12"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1.5"
              strokeDasharray="6 8"
            />

            {TERRITORIES.map((t) => (
              <g key={t.metaphor}>
                <path
                  d={t.path}
                  fill={t.fill}
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="1.25"
                />
                <text
                  x={t.label.x}
                  y={t.label.y}
                  fill="rgba(169, 169, 189, 0.88)"
                  fontSize="11"
                  fontFamily="var(--font-sans), system-ui, sans-serif"
                  letterSpacing="0.02em"
                >
                  {t.metaphor.charAt(0).toUpperCase() + t.metaphor.slice(1).toLowerCase()}
                </text>
              </g>
            ))}

            {/* Kinship edges — quiet at rest; focused neighborhood lights gold */}
            {edges.map(({ a, b }) => {
              const wa = bySlug.get(a);
              const wb = bySlug.get(b);
              if (!wa || !wb) return null;
              const strong =
                focused !== null &&
                ((focused === a && neighborSet.has(b)) ||
                  (focused === b && neighborSet.has(a)));
              const touchesFocus = focused === a || focused === b;
              // Resting atlas: faint graph texture only. Focus: lit warps (mist — not gold fuel).
              if (!strong && !touchesFocus) {
                return (
                  <line
                    key={`${a}|${b}`}
                    x1={wa.x}
                    y1={wa.y}
                    x2={wb.x}
                    y2={wb.y}
                    stroke="rgba(255, 255, 255, 0.055)"
                    strokeWidth={1}
                    strokeLinecap="round"
                  />
                );
              }
              return (
                <line
                  key={`${a}|${b}`}
                  x1={wa.x}
                  y1={wa.y}
                  x2={wb.x}
                  y2={wb.y}
                  stroke={
                    strong
                      ? "rgba(210, 210, 220, 0.55)"
                      : "rgba(210, 210, 220, 0.28)"
                  }
                  strokeWidth={strong ? 2.25 : 1.5}
                  strokeLinecap="round"
                  className="motion-safe:transition-[stroke,stroke-width] motion-safe:duration-300"
                />
              );
            })}

            {atlas.map((w) => {
              const selected = focused === w.slug;
              const isNeighbor = neighborSet.has(w.slug);
              const dimmed =
                focused !== null && !selected && !isNeighbor;
              const isCurrent =
                currentSlug === w.slug ||
                (currentSlug === "sci-fi" && w.slug === "science-fiction");
              const accent = accentVar(w.world);
              const name = displayName(w.slug);
              const r = selected ? 11 : 9;
              const showFocusRing = domFocus === w.slug;

              return (
                <g
                  key={w.slug}
                  opacity={dimmed ? 0.42 : 1}
                  className="motion-safe:transition-opacity motion-safe:duration-300"
                >
                  {/* SVG <a> stays in SVG namespace; SPA via navigate.
                      Keyboard: Tab focuses; Enter/Space open (native + handler). */}
                  <a
                    href={genreSelfEnterPath(w.slug)}
                    data-testid={`node-${w.slug}`}
                    tabIndex={0}
                    role="link"
                    aria-label={`${name} world - ${shelfStatusAria(w.status, w.count)}. Enter.`}
                    aria-current={isCurrent ? "page" : undefined}
                    onFocus={() => {
                      setFocused(w.slug);
                      setDomFocus(w.slug);
                    }}
                    onBlur={() =>
                      setDomFocus((cur) => (cur === w.slug ? null : cur))
                    }
                    onMouseEnter={() => setFocused(w.slug)}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(genreSelfEnterPath(w.slug));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(genreSelfEnterPath(w.slug));
                      }
                    }}
                    className="world-marker outline-none [touch-action:manipulation]"
                    data-hit-r={hitR}
                  >
                    {/* Focus halo via SVG opacity attr — CSS :focus on SVG <a> is flaky */}
                    <circle
                      className="marker-focus-ring pointer-events-none motion-safe:transition-opacity motion-safe:duration-150"
                      cx={w.x}
                      cy={w.y}
                      r={r + 10}
                      fill="none"
                      stroke={`color-mix(in oklab, ${accent} 85%, white)`}
                      strokeWidth={2.5}
                      opacity={showFocusRing ? 1 : 0}
                      aria-hidden
                    />
                    {selected && (
                      <circle
                        cx={w.x}
                        cy={w.y}
                        r={22}
                        fill={`color-mix(in oklab, ${accent} 22%, transparent)`}
                        aria-hidden
                      />
                    )}
                    {/* Invisible pad — live r floors CSS diam ≥44 (W2.5). */}
                    <circle
                      cx={w.x}
                      cy={w.y}
                      r={hitR}
                      fill="transparent"
                      data-testid={`node-hit-${w.slug}`}
                      aria-hidden
                    />
                    <circle
                      cx={w.x}
                      cy={w.y}
                      r={r + 4}
                      fill="none"
                      stroke={
                        selected
                          ? `color-mix(in oklab, ${accent} 55%, transparent)`
                          : isCurrent
                            ? `color-mix(in oklab, ${accent} 40%, transparent)`
                            : "transparent"
                      }
                      strokeWidth={selected || isCurrent ? 1.5 : 0}
                      className="pointer-events-none"
                      aria-hidden
                    />
                    <StatusMarker
                      cx={w.x}
                      cy={w.y}
                      r={r}
                      status={w.status}
                      selected={selected}
                      accent={accent}
                    />
                    <text
                      x={w.x}
                      y={w.y + r + 16}
                      textAnchor="middle"
                      fill={
                        selected
                          ? "rgba(245, 244, 240, 0.95)"
                          : "rgba(210, 210, 220, 0.88)"
                      }
                      fontSize="12"
                      fontFamily="var(--font-sans), system-ui, sans-serif"
                      fontWeight={selected ? 600 : 500}
                    >
                      {name}
                    </text>
                    {w.count > 0 && (
                      <text
                        x={w.x}
                        y={w.y + r + 30}
                        textAnchor="middle"
                        fill="rgba(169, 169, 189, 0.95)"
                        fontSize="10"
                        fontFamily="var(--font-mono, ui-monospace), monospace"
                      >
                        {w.count}
                      </text>
                    )}
                  </a>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

function StatusMarker({
  cx,
  cy,
  r,
  status,
  selected,
  accent,
}: {
  cx: number;
  cy: number;
  r: number;
  status: ShelfStatus;
  selected: boolean;
  accent: string;
}) {
  if (status === "filled") {
    // World accent owns filled nodes — hub gold reserved for Shell Worlds active.
    return (
      <>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={`color-mix(in oklab, ${accent} 78%, transparent)`}
          stroke={
            selected
              ? `color-mix(in oklab, ${accent} 92%, white)`
              : `color-mix(in oklab, ${accent} 45%, transparent)`
          }
          strokeWidth={selected ? 2 : 1}
        />
        <circle cx={cx} cy={cy} r={3} fill="rgba(20, 18, 14, 0.55)" aria-hidden />
      </>
    );
  }
  if (status === "sparse") {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="rgba(180, 180, 195, 0.55)"
        stroke={selected ? "rgba(220, 220, 230, 0.7)" : "rgba(255, 255, 255, 0.18)"}
        strokeWidth={selected ? 2 : 1}
      />
    );
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="rgba(12, 12, 18, 0.65)"
      stroke={selected ? "rgba(200, 200, 210, 0.65)" : "rgba(255, 255, 255, 0.28)"}
      strokeWidth={selected ? 2 : 1.5}
    />
  );
}

function FocusStrip({
  world,
  neighbors,
  bySlug,
  compact = false,
  canResume = false,
  resumeMediaType = "movie",
}: {
  world: MapWorld;
  neighbors: string[];
  bySlug: Map<string, MapWorld>;
  compact?: boolean;
  canResume?: boolean;
  resumeMediaType?: "movie" | "tv";
}) {
  const name = displayName(world.slug);
  const accent = accentVar(world.world);
  const detail = shelfStatusDetail(world.count);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] ${
        compact ? "p-3" : "p-4"
      }`}
      data-testid="chart-focus"
      style={{ ["--world-accent" as string]: accent }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-3 left-0 w-px bg-[var(--world-accent)] opacity-70"
      />
      <div className="pl-3">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            <p className="text-[11px] tracking-tight text-mist-300">
              {world.world.metaphor}
            </p>
            <p
              className={`mt-0.5 font-display font-semibold tracking-tight text-mist-100 ${
                compact ? "text-base" : "text-lg"
              }`}
            >
              {name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-mist-300">
              <StatusDot status={world.status} />
              {SHELF_STATUS_COPY[world.status]}
              <span className="text-mist-300">· {detail}</span>
            </span>
            {canResume ? (
              <Link
                to={genreGuidedResumePath(world.slug, resumeMediaType)}
                data-testid={`resume-tour-${world.slug}`}
                aria-label={`Resume ${name} guided tour`}
                className="inline-flex min-h-11 items-center rounded-lg border border-white/[0.1] bg-white/[0.03] px-3.5 text-sm font-medium text-mist-200 transition-[border-color,background-color,color] duration-200 hover:border-white/20 hover:bg-white/[0.06] hover:text-mist-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400/60"
              >
                Resume tour
              </Link>
            ) : null}
            <Link
              to={genreSelfEnterPath(world.slug)}
              data-testid={`enter-${world.slug}`}
              aria-label={`Enter ${name} world`}
              className="inline-flex min-h-11 items-center rounded-lg bg-gold-400/15 px-4 text-sm font-medium text-gold-400 ring-1 ring-gold-400/35 transition-[background-color,color] duration-200 hover:bg-gold-400/25 hover:text-gold-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400/60"
            >
              Enter {name}
            </Link>
          </div>
        </div>

        {neighbors.length > 0 && (
          <div
            className={`border-t border-white/[0.05] ${
              compact ? "mt-2.5 pt-2.5" : "mt-3 pt-3"
            }`}
          >
            <p className="mb-2 text-[11px] tracking-tight text-mist-300">
              Warps
            </p>
            <ul className="flex flex-wrap gap-2" aria-label={`Neighbors of ${name}`}>
              {neighbors.map((slug) => {
                const n = bySlug.get(slug);
                if (!n) return null;
                return (
                  <li key={slug}>
                    <Link
                      to={genreSelfEnterPath(slug)}
                      data-testid={`warp-${slug}`}
                      aria-label={`Warp to ${displayName(slug)} world`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-sm text-mist-200 transition-[border-color,background-color,color] duration-200 hover:border-white/20 hover:bg-white/[0.05] hover:text-mist-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400/60"
                    >
                      <StatusDot status={n.status} />
                      {displayName(slug)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
