import type OpenAI from "openai";
import type { DB } from "../db/connection.js";
import {
  computeTasteProfile,
  renderTasteProfile,
} from "../rag/tasteProfile.js";
import { fatigueScores, isRetired, logAnchor } from "../services/anchorService.js";
import { fetchDetailsFromTmdb } from "../services/libraryService.js";
import { getEntryByTmdb } from "../services/libraryService.js";
import type { MediaType } from "../tmdb/types.js";
import { currentModel, getLlm, getSetting, setSetting } from "./openrouter.js";
import { insightPrompt } from "./prompts.js";
import { retrieveLibrary } from "../rag/retrieval.js";

export type InsightVerdict = "love" | "maybe" | "skip" | "rewatch";
export type InsightRelation = "echoes" | "warns" | "diverges";
export type ProfileState = "empty" | "thin" | "rich";

export interface InsightComparison {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  year: number | null;
  relation: InsightRelation;
  note: string;
}

export interface InsightFollowup {
  label: string;
  prefill: string;
}

export interface TitleInsight {
  text: string;
  verdict: InsightVerdict;
  matchScore: number | null;
  comparisons: InsightComparison[];
  hook: string | null;
  followups: InsightFollowup[];
  profileState: ProfileState;
  cached: boolean;
  model: string;
}

type OwnedStub = { status?: string; rating?: number | null } | null;

function coerceVerdict(v: unknown, owned: OwnedStub): InsightVerdict {
  if (
    owned &&
    (owned.status === "watched" ||
      owned.status === "watching" ||
      owned.status === "abandoned") &&
    owned.rating != null
  ) {
    return "rewatch";
  }
  if (v === "love" || v === "maybe" || v === "skip" || v === "rewatch")
    return v;
  return "maybe";
}

function buildFollowups(title: string, verdict: InsightVerdict): InsightFollowup[] {
  const t = title.replace(/"/g, "");
  const out: InsightFollowup[] = [
    {
      label: "Compare to my favorites",
      prefill: `How does "${t}" compare to the titles I've loved? No spoilers.`,
    },
  ];
  if (verdict === "skip" || verdict === "maybe") {
    out.push({
      label: "Why might I not finish it?",
      prefill: `I'm wary of "${t}" — based on my history, what's the realistic risk I drop it? No spoilers.`,
    });
  }
  return out;
}

const RELATIONS = new Set<InsightRelation>(["echoes", "warns", "diverges"]);

/**
 * Tolerant parse of the LLM's structured output into a TitleInsight.
 * Any user-selected OpenRouter model can misbehave, so we degrade gracefully:
 * prose-only → verdict "maybe", no comparisons; malformed JSON → treat raw as text.
 */
export function assembleInsight(
  raw: string,
  opts: { profileState: ProfileState; owned: OwnedStub; title?: string },
): TitleInsight {
  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s !== -1 && e > s) {
      try {
        parsed = JSON.parse(raw.slice(s, e + 1));
      } catch {
        parsed = null;
      }
    }
  }

  const text =
    parsed?.text && typeof parsed.text === "string" && parsed.text.trim()
      ? parsed.text.trim()
      : raw.trim();
  const verdict = coerceVerdict(parsed?.verdict, opts.owned);
  const thin = opts.profileState !== "rich";
  const matchScore =
    thin || typeof parsed?.matchScore !== "number"
      ? null
      : Math.max(0, Math.min(100, Math.round(parsed.matchScore)));
  const comparisons: InsightComparison[] =
    thin || !Array.isArray(parsed?.comparisons)
      ? []
      : parsed.comparisons
          .filter(
            (c: any) =>
              c && typeof c.tmdbId === "number" && RELATIONS.has(c.relation),
          )
          .slice(0, 3)
          .map((c: any) => ({
            tmdbId: c.tmdbId,
            mediaType: c.mediaType === "tv" ? "tv" : "movie",
            title: String(c.title ?? "Untitled"),
            year: typeof c.year === "number" ? c.year : null,
            relation: c.relation,
            note: String(c.note ?? ""),
          }));
  const hook =
    typeof parsed?.hook === "string" && parsed.hook.trim()
      ? parsed.hook.trim()
      : null;

  return {
    text,
    verdict,
    matchScore,
    comparisons,
    hook,
    followups: buildFollowups(opts.title ?? "this", verdict),
    profileState: opts.profileState,
    cached: false,
    model: "",
  };
}

export function profileStateOf(p: {
  librarySize: number;
  ratedCount: number;
  lovedTitles: unknown[];
  dislikedTitles: unknown[];
}): ProfileState {
  if (p.librarySize === 0) return "empty";
  const rich =
    (p.lovedTitles.length > 0 || p.dislikedTitles.length > 0) &&
    p.ratedCount >= 8;
  return rich ? "rich" : "thin";
}

/** Backfill fields missing from a pre-structured cache entry (prose-only). */
export function migrateCachedInsight(parsed: any, model: string): TitleInsight {
  return {
    text: String(parsed?.text ?? ""),
    verdict:
      parsed?.verdict === "love" ||
      parsed?.verdict === "maybe" ||
      parsed?.verdict === "skip" ||
      parsed?.verdict === "rewatch"
        ? parsed.verdict
        : "maybe",
    matchScore:
      typeof parsed?.matchScore === "number" ? parsed.matchScore : null,
    comparisons: Array.isArray(parsed?.comparisons) ? parsed.comparisons : [],
    hook: typeof parsed?.hook === "string" ? parsed.hook : null,
    followups: Array.isArray(parsed?.followups)
      ? parsed.followups
      : [{ label: "Compare to my favorites", prefill: `How does this compare to the titles I've loved? No spoilers.` }],
    profileState: parsed?.profileState === "rich" || parsed?.profileState === "thin" || parsed?.profileState === "empty" ? parsed.profileState : "rich",
    cached: true,
    model,
  };
}

/**
 * "Why you'll love this" — a one-shot personalized reflection for a title,
 * grounded in the taste profile. Cached per title until refreshed.
 */
export async function titleInsight(
  db: DB,
  tmdbId: number,
  mediaType: MediaType,
  refresh = false,
): Promise<TitleInsight> {
  const cacheKey = `insight:${mediaType}:${tmdbId}`;
  if (!refresh) {
    const cached = getSetting(db, cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as Partial<TitleInsight> & {
        text?: string;
      };
      // Migrate pre-structured (prose-only) cache entries gracefully.
      if (!parsed || typeof parsed.text !== "string") {
        return {
          text: "No insight available right now.",
          verdict: "maybe",
          matchScore: null,
          comparisons: [],
          hook: null,
          followups: [],
          profileState: "rich",
          cached: true,
          model: parsed?.model ?? "",
        };
      }
      if (parsed.verdict === undefined) {
        return migrateCachedInsight(parsed, parsed.model ?? "");
      }
      return { ...parsed, cached: true } as TitleInsight;
    }
  }

  const [details, profile] = await Promise.all([
    fetchDetailsFromTmdb(tmdbId, mediaType),
    Promise.resolve(computeTasteProfile(db)),
  ]);
  // Anti-fatigue: opening a title's insight card frames via the user's loved
  // titles — that IS a "like X" comparison moment, so log those as anchors
  // too (the "take" surface). Skips retired titles.
  for (const t of profile.lovedTitles) {
    if (!isRetired(db, t.tmdbId, t.mediaType)) {
      logAnchor(db, t.tmdbId, t.mediaType, "take");
    }
  }
  const owned = getEntryByTmdb(db, tmdbId, mediaType);
  const profileState = profileStateOf(profile);

  const titleBlock = [
    `Title: ${details.title}${details.year ? ` (${details.year})` : ""} — ${mediaType === "tv" ? "series" : "film"}`,
    details.tagline ? `Tagline: ${details.tagline}` : "",
    `Genres: ${details.genres.join(", ")}`,
    details.director ? `Director/creator: ${details.director}` : "",
    `Cast: ${details.cast.slice(0, 6).map((c) => c.name).join(", ")}`,
    `TMDB rating: ${details.voteAverage ?? "—"}`,
    `Premise: ${details.overview}`,
    owned
      ? `Already in their library: status ${owned.status}${owned.rating ? `, their rating ${owned.rating}/10` : ""}${owned.notes ? `, their notes: "${owned.notes}"` : ""}`
      : "Not in their library yet.",
  ]
    .filter(Boolean)
    .join("\n");

  // Layer 2 — their own library titles most similar to this one.
  const neighbors = retrieveLibrary(
    db,
    `${details.title} ${details.genres.join(" ")} ${details.director ?? ""}`,
    8,
  );
  // Anti-fatigue: drop retired neighbors, surface fresh ones first, and log
  // the chosen anchors so the fatigue signal keeps accruing on real usage.
  const fatigue = fatigueScores(db);
  const usableNeighbors = neighbors.filter(
    (n) => !isRetired(db, n.tmdbId, n.mediaType),
  );
  const orderedNeighbors = [...usableNeighbors].sort(
    (a, b) =>
      (fatigue.get(`${a.mediaType}:${a.tmdbId}`) ?? 0) -
      (fatigue.get(`${b.mediaType}:${b.tmdbId}`) ?? 0),
  );
  for (const n of orderedNeighbors.slice(0, 3)) {
    logAnchor(db, n.tmdbId, n.mediaType, "insight_neighbors");
  }
  const neighborBlock = orderedNeighbors.length
    ? "Titles from THEIR LIBRARY most like this one (cite these tmdbIds in comparisons):\n" +
      orderedNeighbors
        .map(
          (n) =>
            `- ${n.title} (tmdbId ${n.tmdbId}, ${n.mediaType}, rated ${n.rating ?? "—"}/10)`,
        )
        .join("\n")
    : "No similar titles in their library yet.";

  const llm = getLlm();
  const model = currentModel(db);
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: insightPrompt(profileState) },
    {
      role: "user",
      content: `## The user's taste profile\n${renderTasteProfile(profile)}\n\n## The title\n${titleBlock}\n\n## Their closest library titles\n${neighborBlock}`,
    },
  ];

  // JSON mode (response_format) is not supported by every OpenRouter
  // provider — free/community models often reject it with
  // "400 Provider returned error". The prompt already demands a bare JSON
  // object and assembleInsight parses tolerantly, so when the provider
  // refuses the parameter we retry once without it instead of failing
  // the whole card.
  let completion;
  try {
    completion = await llm.chat.completions.create({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages,
    });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status !== 400 && status !== 404 && status !== 422) throw err;
    completion = await llm.chat.completions.create({
      model,
      temperature: 0.7,
      messages,
    });
  }

  const raw =
    completion.choices[0]?.message?.content?.trim() ??
    "No insight available right now.";
  const insight = assembleInsight(raw, {
    profileState,
    owned,
    title: details.title,
  });
  insight.model = model;
  setSetting(db, cacheKey, JSON.stringify(insight));
  return insight;
}
