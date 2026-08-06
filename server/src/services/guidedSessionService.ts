import type { DB } from "../db/connection.js";
import { getSetting, setSetting } from "../llm/openrouter.js";
import { addToLibrary } from "./libraryService.js";
import type { MediaType } from "../tmdb/types.js";
import { assertKnownWorldSlug, KNOWN_WORLD_SLUGS, sanitizeGenreSlug } from "./worldSlug.js";

export type GuidedBeatId = "tempo" | "era" | "risk";
export type GuidedChoiceId = string;

export interface GuidedBeatChoice {
  id: GuidedChoiceId;
  label: string;
  hint: string;
}

export interface GuidedBeat {
  id: GuidedBeatId;
  prompt: string;
  choices: GuidedBeatChoice[];
}

export interface GuidedAct {
  tmdbId: number;
  mediaType: MediaType;
  action: "watchlist" | "dismiss" | "open";
  at: string;
}

export interface GuidedPick {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  voteAverage: number | null;
  inLibrary: boolean;
}

export interface GuidedSession {
  slug: string;
  mediaType: MediaType;
  status: "active" | "complete" | "abandoned";
  answers: Partial<Record<GuidedBeatId, GuidedChoiceId>>;
  picks: GuidedPick[];
  acted: GuidedAct[];
  conversationId: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Rankable item shape — matches CatalogItemWithFlags fields we need. */
export interface GuidedRankable {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  voteAverage: number | null;
  popularity?: number | null;
  inLibrary?: boolean;
}

/** Metaphor keys mirror client `GenreWorld.metaphor` — curated voice, not LLM. */
export type GuidedMetaphor =
  | "Constellation"
  | "Threshold"
  | "Reading Room"
  | "Warm Interior"
  | "Frontier"
  | "Panel"
  | "Generic";

/** Slim slug → metaphor map (keeps server free of full genreWorld matrix). */
const SLUG_METAPHOR: Record<string, GuidedMetaphor> = {
  documentary: "Reading Room",
  history: "Reading Room",
  "war-politics": "Reading Room",
  "science-fiction": "Constellation",
  "sci-fi": "Constellation",
  fantasy: "Constellation",
  horror: "Threshold",
  "film-noir": "Threshold",
  thriller: "Threshold",
  romance: "Warm Interior",
  comedy: "Warm Interior",
  western: "Frontier",
  travel: "Frontier",
  anime: "Panel",
  crime: "Panel",
  mystery: "Panel",
  music: "Panel",
};

const ERA_CHOICES: GuidedBeatChoice[] = [
  { id: "classic", label: "Classic", hint: "Before 1990" },
  { id: "turn", label: "Turn of century", hint: "1990–2009" },
  { id: "now", label: "Now", hint: "2010 and after" },
];

/** Choice ids stay stable for ranking; copy is metaphor-flavored. */
const BEATS_BY_METAPHOR: Record<GuidedMetaphor, GuidedBeat[]> = {
  "Reading Room": [
    {
      id: "tempo",
      prompt: "How should the argument unfold tonight?",
      choices: [
        { id: "slow", label: "Patient cut", hint: "Evidence that lingers" },
        { id: "mid", label: "Clear through-line", hint: "Steady, credible pace" },
        { id: "kinetic", label: "Sharp cut", hint: "Forward, no digression" },
      ],
    },
    {
      id: "era",
      prompt: "Which archive shelf do you want open?",
      choices: ERA_CHOICES,
    },
    {
      id: "risk",
      prompt: "Known sources, or the contested stack?",
      choices: [
        { id: "comfort", label: "Cited & sure", hint: "Acclaimed, solid footing" },
        { id: "stretch", label: "Fringe dossier", hint: "Lesser-seen edges" },
      ],
    },
  ],
  Constellation: [
    {
      id: "tempo",
      prompt: "What orbit do you want tonight?",
      choices: [
        { id: "slow", label: "Drift", hint: "Wonder, long takes" },
        { id: "mid", label: "Cruise", hint: "Measured expanse" },
        { id: "kinetic", label: "Burn", hint: "Scale and thrust" },
      ],
    },
    {
      id: "era",
      prompt: "Which star-era lights the map?",
      choices: ERA_CHOICES,
    },
    {
      id: "risk",
      prompt: "Stay in charted space, or jump the dark?",
      choices: [
        { id: "comfort", label: "Charted", hint: "Beloved, high signal" },
        { id: "stretch", label: "Dark matter", hint: "Obscure orbits" },
      ],
    },
  ],
  Threshold: [
    {
      id: "tempo",
      prompt: "How close to the door tonight?",
      choices: [
        { id: "slow", label: "Creeping", hint: "Dread that accumulates" },
        { id: "mid", label: "Tight coil", hint: "Steady tension" },
        { id: "kinetic", label: "Breach", hint: "No time to breathe" },
      ],
    },
    {
      id: "era",
      prompt: "Which side of the threshold?",
      choices: ERA_CHOICES,
    },
    {
      id: "risk",
      prompt: "Safe corridor, or the room you avoid?",
      choices: [
        { id: "comfort", label: "Known dread", hint: "Acclaimed, sure scare" },
        { id: "stretch", label: "Unmarked door", hint: "Lesser-seen edges" },
      ],
    },
  ],
  "Warm Interior": [
    {
      id: "tempo",
      prompt: "How should the room feel tonight?",
      choices: [
        { id: "slow", label: "Ember", hint: "Soft, lingering warmth" },
        { id: "mid", label: "Hearth", hint: "Steady, attentive" },
        { id: "kinetic", label: "Spark", hint: "Bright, quick pulse" },
      ],
    },
    {
      id: "era",
      prompt: "Which decade hangs on the wall?",
      choices: ERA_CHOICES,
    },
    {
      id: "risk",
      prompt: "Familiar chairs, or a stranger at the table?",
      choices: [
        { id: "comfort", label: "Beloved", hint: "Sure, acclaimed warmth" },
        { id: "stretch", label: "New guest", hint: "Quieter discoveries" },
      ],
    },
  ],
  Frontier: [
    {
      id: "tempo",
      prompt: "How hard do we ride tonight?",
      choices: [
        { id: "slow", label: "Dust trail", hint: "Spare, weather-beaten" },
        { id: "mid", label: "Steady gait", hint: "Resolute pace" },
        { id: "kinetic", label: "Hard gallop", hint: "Restless thrust" },
      ],
    },
    {
      id: "era",
      prompt: "Which horizon year underfoot?",
      choices: ERA_CHOICES,
    },
    {
      id: "risk",
      prompt: "Known trail, or the unmarked ridge?",
      choices: [
        { id: "comfort", label: "Known trail", hint: "Acclaimed, sure footing" },
        { id: "stretch", label: "Unmarked ridge", hint: "Lesser-seen country" },
      ],
    },
  ],
  Panel: [
    {
      id: "tempo",
      prompt: "What panel rhythm tonight?",
      choices: [
        { id: "slow", label: "Wide panel", hint: "Lore that breathes" },
        { id: "mid", label: "Steady gutters", hint: "Clear beat" },
        { id: "kinetic", label: "Splash page", hint: "Forward, vivid" },
      ],
    },
    {
      id: "era",
      prompt: "Which issue era on the shelf?",
      choices: ERA_CHOICES,
    },
    {
      id: "risk",
      prompt: "Canon favorite, or deep cut?",
      choices: [
        { id: "comfort", label: "Canon", hint: "Acclaimed, sure pick" },
        { id: "stretch", label: "Deep cut", hint: "Lesser-seen threads" },
      ],
    },
  ],
  Generic: [
    {
      id: "tempo",
      prompt: "How should this world move tonight?",
      choices: [
        { id: "slow", label: "Slow burn", hint: "Patient, lingering" },
        { id: "mid", label: "Measured", hint: "Steady pulse" },
        { id: "kinetic", label: "Kinetic", hint: "Forward thrust" },
      ],
    },
    {
      id: "era",
      prompt: "Which era do you want underfoot?",
      choices: ERA_CHOICES,
    },
    {
      id: "risk",
      prompt: "Stay close, or stretch?",
      choices: [
        { id: "comfort", label: "Comfort", hint: "Acclaimed, sure footing" },
        { id: "stretch", label: "Stretch", hint: "Lesser-known edges" },
      ],
    },
  ],
};

/** Default / Generic beats — stable export for tests & fallbacks. */
export const GUIDED_BEATS: GuidedBeat[] = BEATS_BY_METAPHOR.Generic;

export function metaphorForSlug(slug: string): GuidedMetaphor {
  return SLUG_METAPHOR[slug] ?? "Generic";
}

/** Curated beat copy for a world slug. Choice ids are invariant. */
export function beatsForSlug(slug: string): GuidedBeat[] {
  return BEATS_BY_METAPHOR[metaphorForSlug(slug)];
}

const BEAT_IDS: GuidedBeatId[] = ["tempo", "era", "risk"];

function sessionKey(slug: string, mediaType: MediaType): string {
  return `guided-session:${slug}:${mediaType}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function emptySession(slug: string, mediaType: MediaType): GuidedSession {
  const t = nowIso();
  return {
    slug,
    mediaType,
    status: "active",
    answers: {},
    picks: [],
    acted: [],
    conversationId: null,
    createdAt: t,
    updatedAt: t,
  };
}

function parseSession(raw: string | null, slug: string, mediaType: MediaType): GuidedSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GuidedSession;
    if (parsed.slug !== slug || parsed.mediaType !== mediaType) return null;
    return {
      ...emptySession(slug, mediaType),
      ...parsed,
      answers: parsed.answers ?? {},
      picks: parsed.picks ?? [],
      acted: parsed.acted ?? [],
    };
  } catch {
    return null;
  }
}

function saveSession(db: DB, session: GuidedSession): GuidedSession {
  const next = { ...session, updatedAt: nowIso() };
  if (BEAT_IDS.every((id) => next.answers[id])) {
    next.status = "complete";
  } else if (next.status === "complete") {
    next.status = "active";
  }
  setSetting(db, sessionKey(session.slug, session.mediaType), JSON.stringify(next));
  return next;
}

/**
 * Read-only session lookup — never persists.
 * Hub Resume peeks must use this (or peekGuidedSessionProgress) so empty
 * atlas doors do not write `guided-session:*` shells.
 */
export function getGuidedSession(
  db: DB,
  slug: string,
  mediaType: MediaType,
): GuidedSession | null {
  const world = assertKnownWorldSlug(slug);
  return parseSession(getSetting(db, sessionKey(world, mediaType)), world, mediaType);
}

/** True when a session has real tour progress (not a fresh empty shell). */
export function guidedSessionHasProgress(session: GuidedSession): boolean {
  if (session.status === "complete") return true;
  if (Object.keys(session.answers).length > 0) return true;
  if (session.acted.length > 0) return true;
  return false;
}

/**
 * Hub peek: movie then tv — first mediaType with progress wins.
 * Never creates settings rows.
 */
export function peekGuidedSessionProgress(
  db: DB,
  slug: string,
): GuidedSession | null {
  const world = assertKnownWorldSlug(slug);
  for (const mediaType of ["movie", "tv"] as const) {
    const session = getGuidedSession(db, world, mediaType);
    if (session && guidedSessionHasProgress(session)) return session;
  }
  return null;
}

export function getOrCreateGuidedSession(
  db: DB,
  slug: string,
  mediaType: MediaType,
): GuidedSession {
  const world = assertKnownWorldSlug(slug);
  const existing = parseSession(
    getSetting(db, sessionKey(world, mediaType)),
    world,
    mediaType,
  );
  if (existing) return existing;
  const created = emptySession(world, mediaType);
  setSetting(db, sessionKey(world, mediaType), JSON.stringify(created));
  return created;
}

export function answerGuidedBeat(
  db: DB,
  slug: string,
  mediaType: MediaType,
  beatId: GuidedBeatId,
  choiceId: GuidedChoiceId,
): GuidedSession {
  const world = assertKnownWorldSlug(slug);
  const beat = beatsForSlug(world).find((b) => b.id === beatId);
  if (!beat) throw Object.assign(new Error(`Unknown beat: ${beatId}`), { statusCode: 400 });
  if (!beat.choices.some((c) => c.id === choiceId)) {
    throw Object.assign(new Error(`Unknown choice: ${choiceId}`), { statusCode: 400 });
  }
  const session = getOrCreateGuidedSession(db, world, mediaType);
  return saveSession(db, {
    ...session,
    answers: { ...session.answers, [beatId]: choiceId },
  });
}

export function resetGuidedSession(
  db: DB,
  slug: string,
  mediaType: MediaType,
): GuidedSession {
  const world = assertKnownWorldSlug(slug);
  const fresh = emptySession(world, mediaType);
  setSetting(db, sessionKey(world, mediaType), JSON.stringify(fresh));
  return fresh;
}

function eraMatch(year: number | null, choice: GuidedChoiceId | undefined): boolean {
  if (year == null || !choice) return false;
  if (choice === "classic") return year < 1990;
  if (choice === "turn") return year >= 1990 && year <= 2009;
  if (choice === "now") return year >= 2010;
  return false;
}

/** Prestige / named-classic refs used for Tonight shelf trust. */
export interface GuidedSeedRef {
  tmdbId: number;
  mediaType: MediaType;
}

/**
 * Curated world seeds (TMDB ids). Classic Claim must surface ≥1 of these when
 * present in the rail — not three hot popularity hits that break "Seeded by…" trust.
 */
export const GUIDED_WORLD_SEEDS: Record<string, GuidedSeedRef[]> = {
  horror: [
    { tmdbId: 1091, mediaType: "movie" }, // The Thing (1982)
    { tmdbId: 9552, mediaType: "movie" }, // The Exorcist (1973)
    { tmdbId: 805, mediaType: "movie" }, // Rosemary's Baby (1968)
  ],
  "science-fiction": [
    { tmdbId: 1091, mediaType: "movie" }, // The Thing (1982)
    { tmdbId: 348, mediaType: "movie" }, // Alien (1979)
  ],
  "sci-fi": [
    { tmdbId: 1091, mediaType: "movie" },
    { tmdbId: 348, mediaType: "movie" },
  ],
};

export function seedsForSlug(slug: string): GuidedSeedRef[] {
  return GUIDED_WORLD_SEEDS[slug.toLowerCase()] ?? [];
}

function itemKey(it: { tmdbId: number; mediaType: MediaType }): string {
  return `${it.mediaType}:${it.tmdbId}`;
}

function mergeSeedRefs(...lists: GuidedSeedRef[][]): GuidedSeedRef[] {
  const seen = new Set<string>();
  const out: GuidedSeedRef[] = [];
  for (const list of lists) {
    for (const s of list) {
      const k = itemKey(s);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(s);
    }
  }
  return out;
}

export interface RankForGuidedOpts {
  /** World slug → resolve GUIDED_WORLD_SEEDS. */
  slug?: string;
  /** Extra seeds (e.g. library anchorsUsed). */
  seeds?: GuidedSeedRef[];
  /** Tonight shelf length — seed injection targets this window. */
  shelfLimit?: number;
}

/**
 * Guarantee ≥1 seed/prestige title in the Tonight window when Classic is
 * dialed or a seed list exists. Swaps into the last shelf slot if needed.
 */
export function injectSeedIntoShelf<T extends GuidedRankable>(
  ranked: T[],
  opts: {
    era?: GuidedChoiceId;
    seeds?: GuidedSeedRef[];
    limit?: number;
  },
): T[] {
  const limit = opts.limit ?? 3;
  const seeds = opts.seeds ?? [];
  const needTrust = opts.era === "classic" || seeds.length > 0;
  if (!needTrust || ranked.length === 0 || limit <= 0) return ranked;

  const seedSet = new Set(seeds.map(itemKey));
  const top = ranked.slice(0, limit);
  const topHasSeed = top.some((it) => seedSet.has(itemKey(it)));
  if (topHasSeed) return ranked;

  let injectIdx = -1;
  if (seedSet.size) {
    injectIdx = ranked.findIndex((it, i) => i >= limit && seedSet.has(itemKey(it)));
    if (injectIdx < 0) {
      injectIdx = ranked.findIndex((it) => seedSet.has(itemKey(it)));
    }
  }

  // Classic dial, no configured seed in pool: best classic-era prestige in rail.
  if (injectIdx < 0 && opts.era === "classic") {
    const topHasClassic = top.some((it) => eraMatch(it.year, "classic"));
    if (!topHasClassic) {
      let bestIdx = -1;
      let bestVote = -1;
      for (let i = 0; i < ranked.length; i++) {
        const it = ranked[i]!;
        if (!eraMatch(it.year, "classic")) continue;
        const vote = it.voteAverage ?? 0;
        if (vote > bestVote) {
          bestVote = vote;
          bestIdx = i;
        }
      }
      if (bestIdx >= limit) injectIdx = bestIdx;
    } else {
      return ranked;
    }
  }

  if (injectIdx < 0 || injectIdx < limit) return ranked;

  const next = ranked.slice();
  const [seed] = next.splice(injectIdx, 1);
  if (!seed) return ranked;
  next.splice(limit - 1, 0, seed);
  return next;
}

/**
 * Pure ranking: guided answers reshape order. Dismissed titles drop out.
 * Higher score = earlier in the rail / more likely on the Tonight shelf.
 * Optional seeds get a trust boost; Classic/seed lists force ≥1 into the shelf window.
 */
export function rankForGuided<T extends GuidedRankable>(
  items: T[],
  session: Pick<GuidedSession, "answers" | "acted">,
  opts?: RankForGuidedOpts,
): T[] {
  const seeds = mergeSeedRefs(opts?.seeds ?? [], opts?.slug ? seedsForSlug(opts.slug) : []);
  const seedSet = new Set(seeds.map(itemKey));
  const shelfLimit = opts?.shelfLimit ?? 3;
  const dismissed = new Set(
    session.acted.filter((a) => a.action === "dismiss").map((a) => `${a.mediaType}:${a.tmdbId}`),
  );
  const scored = items
    .filter((it) => !dismissed.has(`${it.mediaType}:${it.tmdbId}`))
    .map((it) => {
      let score = 0;
      if (!it.inLibrary) score += 40;
      if (eraMatch(it.year, session.answers.era)) score += 25;
      const vote = it.voteAverage ?? 5;
      const pop = it.popularity ?? vote * 10;
      if (session.answers.risk === "comfort") score += vote;
      if (session.answers.risk === "stretch") score += Math.max(0, 10 - vote);
      if (session.answers.tempo === "kinetic") score += Math.min(20, pop / 5);
      if (session.answers.tempo === "slow") score += Math.max(0, 20 - pop / 5);
      if (session.answers.tempo === "mid") score += 8;
      // Overcome in-library demotion so named seeds stay claimable.
      if (seedSet.has(itemKey(it))) score += 80;
      return { it, score };
    });
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.it.title.localeCompare(b.it.title);
  });
  return injectSeedIntoShelf(
    scored.map((s) => s.it),
    { era: session.answers.era, seeds, limit: shelfLimit },
  );
}

export function picksFromItems(items: GuidedRankable[], limit = 3): GuidedPick[] {
  return items.slice(0, limit).map((it) => ({
    tmdbId: it.tmdbId,
    mediaType: it.mediaType,
    title: it.title,
    year: it.year,
    posterPath: it.posterPath,
    voteAverage: it.voteAverage,
    inLibrary: Boolean(it.inLibrary),
  }));
}

/** Recompute Tonight shelf from a ranked item list and persist. */
export function refreshGuidedPicks(
  db: DB,
  slug: string,
  mediaType: MediaType,
  ranked: GuidedRankable[],
): GuidedSession {
  const session = getOrCreateGuidedSession(db, slug, mediaType);
  return saveSession(db, {
    ...session,
    picks: picksFromItems(ranked, 3),
  });
}

export async function actOnGuidedPick(
  db: DB,
  opts: {
    slug: string;
    mediaType: MediaType;
    tmdbId: number;
    titleMediaType: MediaType;
    action: GuidedAct["action"];
    title?: string;
    year?: number | null;
    posterPath?: string | null;
  },
): Promise<GuidedSession> {
  if (!Number.isInteger(opts.tmdbId) || opts.tmdbId <= 0) {
    throw Object.assign(new Error("tmdbId must be a positive integer"), {
      statusCode: 400,
    });
  }
  const world = assertKnownWorldSlug(opts.slug);
  const session = getOrCreateGuidedSession(db, world, opts.mediaType);
  // When Tonight shelf exists, only allow acts on shelf titles (closer to /library rigor).
  if (session.picks.length > 0) {
    const onShelf = session.picks.some(
      (p) => p.tmdbId === opts.tmdbId && p.mediaType === opts.titleMediaType,
    );
    if (!onShelf) {
      throw Object.assign(new Error("tmdbId not in guided picks"), {
        statusCode: 400,
      });
    }
  }
  const act: GuidedAct = {
    tmdbId: opts.tmdbId,
    mediaType: opts.titleMediaType,
    action: opts.action,
    at: nowIso(),
  };

  if (opts.action === "watchlist") {
    await addToLibrary(db, {
      tmdbId: opts.tmdbId,
      mediaType: opts.titleMediaType,
      status: "watchlist",
    });
  }

  const acted = [
    ...session.acted.filter(
      (a) => !(a.tmdbId === act.tmdbId && a.mediaType === act.mediaType),
    ),
    act,
  ];

  let picks = session.picks;
  if (opts.action === "dismiss") {
    picks = picks.filter(
      (p) => !(p.tmdbId === opts.tmdbId && p.mediaType === opts.titleMediaType),
    );
  } else if (opts.action === "watchlist") {
    picks = picks.map((p) =>
      p.tmdbId === opts.tmdbId && p.mediaType === opts.titleMediaType
        ? { ...p, inLibrary: true }
        : p,
    );
  }

  return saveSession(db, { ...session, acted, picks });
}

export function guidedPrefillSummary(session: GuidedSession): string {
  const beats = beatsForSlug(session.slug);
  const parts: string[] = [];
  for (const beat of beats) {
    const choiceId = session.answers[beat.id];
    if (!choiceId) continue;
    const choice = beat.choices.find((c) => c.id === choiceId);
    if (choice) parts.push(`${beat.id}: ${choice.label}`);
  }
  if (!parts.length) {
    return `I'm touring the ${session.slug} world in Guided mode. Help me find what to watch tonight.`;
  }
  return `I'm mid-tour in the ${session.slug} world. My choices so far: ${parts.join("; ")}. Suggest what fits and why.`;
}

/** Bind the in-world Companion conversation to this tour session (same settings blob). */
export function linkGuidedConversation(
  db: DB,
  slug: string,
  mediaType: MediaType,
  conversationId: number,
): GuidedSession {
  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    throw Object.assign(new Error("conversationId required"), { statusCode: 400 });
  }
  const exists = db
    .prepare("SELECT id FROM conversations WHERE id = ?")
    .get(conversationId) as { id: number } | undefined;
  if (!exists) {
    throw Object.assign(new Error("Conversation not found"), { statusCode: 404 });
  }
  const world = assertKnownWorldSlug(slug);
  const session = getOrCreateGuidedSession(db, world, mediaType);
  if (session.conversationId === conversationId) return session;
  return saveSession(db, { ...session, conversationId });
}

/** Look up an active guided session by Companion conversation id. */
export function findGuidedSessionByConversation(
  db: DB,
  conversationId: number,
): GuidedSession | null {
  if (!Number.isFinite(conversationId) || conversationId <= 0) return null;
  const rows = db
    .prepare(`SELECT key, value FROM settings WHERE key LIKE 'guided-session:%'`)
    .all() as { key: string; value: string }[];
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.value) as GuidedSession;
      if (parsed.conversationId !== conversationId) continue;
      if (!parsed.slug || (parsed.mediaType !== "movie" && parsed.mediaType !== "tv")) {
        continue;
      }
      const world = sanitizeGenreSlug(parsed.slug);
      if (!world || !KNOWN_WORLD_SLUGS.has(world)) continue;
      return {
        ...emptySession(world, parsed.mediaType),
        ...parsed,
        slug: world,
        answers: parsed.answers ?? {},
        picks: parsed.picks ?? [],
        acted: parsed.acted ?? [],
      };
    } catch {
      /* skip corrupt row */
    }
  }
  return null;
}

/**
 * Compact RAG block: beats, tonight shelf, recent acts.
 * Companion tools still own library mutations; this is read-side awareness.
 */
export function renderGuidedSessionContext(session: GuidedSession): string {
  // Allowlist before RAG injection — corrupt/unknown slugs never reach the prompt.
  const world = assertKnownWorldSlug(session.slug);
  const metaphor = metaphorForSlug(world);
  const lines: string[] = [
    `Active guided tour · ${metaphor} · world "${world}" · ${session.mediaType} · status ${session.status}.`,
  ];

  const answerBits: string[] = [];
  for (const beat of beatsForSlug(world)) {
    const choiceId = session.answers[beat.id];
    if (!choiceId) {
      answerBits.push(`${beat.id}: unanswered`);
      continue;
    }
    const choice = beat.choices.find((c) => c.id === choiceId);
    answerBits.push(`${beat.id}: ${choice?.label ?? choiceId}`);
  }
  lines.push(`Tour beats: ${answerBits.join("; ")}.`);

  if (session.picks.length) {
    const shelf = session.picks
      .map((p) => {
        const year = p.year != null ? ` (${p.year})` : "";
        const lib = p.inLibrary ? ", in library" : "";
        return `${p.title}${year} [tmdb ${p.mediaType}/${p.tmdbId}${lib}]`;
      })
      .join("; ");
    lines.push(`Tonight shelf: ${shelf}.`);
  } else {
    lines.push("Tonight shelf: empty (answer beats or wait for rail refresh).");
  }

  const recent = session.acted.slice(-6);
  if (recent.length) {
    const acts = recent
      .map((a) => `${a.action} ${a.mediaType}/${a.tmdbId}`)
      .join("; ");
    lines.push(`Recent tour acts: ${acts}.`);
  }

  lines.push(
    "Ground recommendations in these tour choices and shelf titles. Prefer not recommending dismissed ids. When they save a title via tools, the shelf re-flags on the next guided refresh.",
  );
  return lines.join("\n");
}

/**
 * When Companion adds a title during a linked tour, mirror a watchlist act
 * onto the same session blob (no second store). No-op if not linked / not watchlist.
 */
export function syncGuidedWatchlistFromChat(
  db: DB,
  conversationId: number,
  tmdbId: number,
  titleMediaType: MediaType,
): GuidedSession | null {
  const session = findGuidedSessionByConversation(db, conversationId);
  if (!session) return null;
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return null;

  const act: GuidedAct = {
    tmdbId,
    mediaType: titleMediaType,
    action: "watchlist",
    at: nowIso(),
  };
  const acted = [
    ...session.acted.filter(
      (a) => !(a.tmdbId === act.tmdbId && a.mediaType === act.mediaType),
    ),
    act,
  ];
  const picks = session.picks.map((p) =>
    p.tmdbId === tmdbId && p.mediaType === titleMediaType
      ? { ...p, inLibrary: true }
      : p,
  );
  return saveSession(db, { ...session, acted, picks });
}
