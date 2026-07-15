import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { GENRE_WORLDS, getGenreWorld, MOOD_TO_SLUGS } from "../lib/genreWorld.js";
import type { Genre } from "../lib/types.js";

const PROOF_SLUGS = Object.keys(GENRE_WORLDS);

/** Distinct mood words across all worlds, sorted for a stable picker. */
const ALL_MOODS = Array.from(
  new Set(Object.values(GENRE_WORLDS).flatMap((w) => w.register.moods)),
).sort();

function MoodEntry() {
  return (
    <section aria-label="Browse by mood">
      <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-amber-300/70">
        Browse by mood
      </h2>
      <div className="flex flex-wrap gap-2">
        {ALL_MOODS.map((mood) => {
          const slugs = MOOD_TO_SLUGS[mood];
          if (!slugs || slugs.length === 0) return null;
          const target = slugs[0];
          return (
            <Link
              key={mood}
              to={`/genre/${target}`}
              aria-label={`Browse ${mood} worlds`}
              className="rounded-full border border-white/[0.08] px-3 py-1 text-sm capitalize text-white/70 transition-colors hover:border-amber-400/30 hover:text-white/90"
            >
              {mood}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function GenrePicker() {
  const { data: genres } = useQuery({
    queryKey: ["genres"],
    queryFn: () => api.genres(),
  });

  const proof = PROOF_SLUGS.map((slug) => ({ slug, world: getGenreWorld(slug) }));
  const rest: Genre[] = (genres ?? []).filter(
    (g) => !PROOF_SLUGS.includes(slugify(g.name)),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <header>
        <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight text-white">
          Worlds
        </h1>
        <p className="mt-2 font-[var(--font-sans)] text-white/60">
          Step into a genre. Each world is tuned to how you already watch.
        </p>
      </header>

      <MoodEntry />

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-amber-300/70">Featured</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {proof.map(({ slug, world }) => (
            <Link
              key={slug}
              to={`/genre/${slug}`}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-colors hover:border-amber-400/30 hover:bg-amber-400/[0.04]"
            >
              <p className="font-[var(--font-display)] text-xl capitalize text-white/90">{slug}</p>
              <p className="mt-1 text-sm text-amber-300/70">{world.metaphor}</p>
              <p className="mt-2 text-xs text-white/50">{world.register.tonePrompt}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">All genres</h2>
        <div className="flex flex-wrap gap-2">
          {rest.map((g) => (
            <Link
              key={g.id}
              to={`/genre/${slugify(g.name)}`}
              className="rounded-full border border-white/[0.08] px-3 py-1 text-sm text-white/70 transition-colors hover:text-white/90"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
