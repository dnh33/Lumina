import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getGenreWorld } from "../lib/genreWorld.js";
import { accentVar } from "../lib/metaphor.js";

/** Capitalize a slug into a friendly world name (e.g. "science-fiction" → "Science-Fiction"). */
function worldName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}

/**
 * Task 6.7 (C4): Compare mode. Overlays two Worlds (`:a` + `:b` slugs) and
 * shows the parts that line up and the parts that diverge — read-only.
 *
 *   - Shared anchors: titles that appear as anchors in BOTH worlds.
 *   - Divergent theses: each world's curator hook, shown side by side.
 *   - Overlapping titles: the same title present in both worlds' rails.
 *
 * Missing/invalid slugs are handled gracefully: an empty slug short-circuits
 * to a "world not found" note, and a failed fetch renders the same note
 * instead of crashing.
 */
export default function CompareWorlds() {
  const { a = "", b = "" } = useParams<{ a: string; b: string }>();

  const aWorld = getGenreWorld(a);
  const bWorld = getGenreWorld(b);

  const aQuery = useQuery({
    queryKey: ["genre-experience", a, "self", "movie"],
    queryFn: () => api.genreExperience([a], "self", "movie", aWorld.modules),
    enabled: !!a,
  });
  const bQuery = useQuery({
    queryKey: ["genre-experience", b, "self", "movie"],
    queryFn: () => api.genreExperience([b], "self", "movie", bWorld.modules),
    enabled: !!b,
  });

  // Derive the comparison sets up-front so the rules of hooks are never
  // violated by an early return below (all hooks run on every render).
  const sharedAnchors = useMemo(() => {
    const aData = aQuery.data;
    const bData = bQuery.data;
    if (!aData?.anchorsUsed?.length || !bData?.anchorsUsed?.length) return [];
    const bIds = new Set(bData.anchorsUsed.map((x) => x.tmdbId));
    return aData.anchorsUsed.filter((x) => bIds.has(x.tmdbId));
  }, [aQuery.data, bQuery.data]);

  const overlappingTitles = useMemo(() => {
    const aData = aQuery.data;
    const bData = bQuery.data;
    if (!aData?.items?.length || !bData?.items?.length) return [];
    const bTitles = new Set(
      bData.items.map((it) => it.title.trim().toLowerCase()),
    );
    return aData.items
      .filter((it) => bTitles.has(it.title.trim().toLowerCase()))
      .map((it) => it.title);
  }, [aQuery.data, bQuery.data]);

  // Graceful: a missing slug (route `/compare/:a/:b` with an empty segment).
  if (!a || !b) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-white/60">
        <p className="text-lg">World not found.</p>
        <p className="mt-2 text-sm text-white/40">
          Compare two worlds with{" "}
          <code className="rounded bg-white/10 px-1 py-0.5">/compare/{"<slug>"}/{"<slug>"}</code>.
        </p>
      </div>
    );
  }

  const isLoading = aQuery.isLoading || bQuery.isLoading;
  const isError = aQuery.isError || bQuery.isError;

  // Graceful: a fetch failure (invalid slug, server down) — no crash.
  if (isError) {
    const missing = aQuery.isError ? a : bQuery.isError ? b : "";
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-white/60">
        <p className="text-lg">
          {missing ? `“${worldName(missing)}” could not be opened.` : "Couldn’t open these worlds."}
        </p>
        <p className="mt-2 text-sm text-white/40">
          Check the slugs and try again.
        </p>
        <Link
          to="/genre"
          className="mt-4 inline-block rounded-full bg-white/10 px-4 py-2 text-sm text-mist-100 ring-1 ring-white/10 hover:bg-white/15"
        >
          Browse worlds
        </Link>
      </div>
    );
  }

  const aData = aQuery.data;
  const bData = bQuery.data;

  const aHook = aData?.intro?.hook;
  const bHook = bData?.intro?.hook;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header className="space-y-2">
        <p className="text-2xs uppercase tracking-widest text-mist-500">
          Compare worlds
        </p>
        <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold text-mist-100">
          <span style={{ color: accentVar(aWorld) }}>{worldName(a)}</span>
          <span className="text-mist-500">×</span>
          <span style={{ color: accentVar(bWorld) }}>{worldName(b)}</span>
        </h1>
      </header>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-white/[0.04]" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Divergent theses — the two curator hooks side by side. */}
          <section className="rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/10">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-mist-400">
              Divergent theses
            </h2>
            <div className="space-y-4 text-sm leading-relaxed text-mist-200">
              <p style={{ borderColor: accentVar(aWorld) }} className="border-l-2 pl-3">
                {aHook ?? "No thesis for this world."}
              </p>
              <p style={{ borderColor: accentVar(bWorld) }} className="border-l-2 pl-3">
                {bHook ?? "No thesis for this world."}
              </p>
            </div>
          </section>

          {/* Shared anchors — titles anchored in both worlds. */}
          <section className="rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/10">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-mist-400">
              Shared anchors
            </h2>
            {sharedAnchors.length ? (
              <ul className="space-y-2 text-sm text-mist-200">
                {sharedAnchors.map((anchor) => (
                  <li key={anchor.tmdbId} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400/80" />
                    {anchor.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/40">
                No titles anchor both worlds.
              </p>
            )}
          </section>

          {/* Overlapping titles — same title in both rails. */}
          <section className="rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/10 md:col-span-2">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-mist-400">
              Overlapping titles
            </h2>
            {overlappingTitles.length ? (
              <ul className="flex flex-wrap gap-2">
                {overlappingTitles.map((title) => (
                  <li
                    key={title}
                    className="rounded-full bg-white/[0.06] px-3 py-1 text-2xs text-mist-200 ring-1 ring-white/10"
                  >
                    {title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/40">
                These worlds don’t share any titles.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
