import { Link } from "react-router-dom";
import type { GenreAnchor } from "../../lib/types.js";
import type { GenreWorld } from "../../lib/genreWorld.js";

interface Props {
  anchors: GenreAnchor[];
  world: GenreWorld;
}

export function AnchorFrame({ anchors, world }: Props) {
  if (anchors.length === 0) return null;
  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-6" aria-label="From your library">
      <h2 className="font-display text-lg font-semibold tracking-tight text-white/90">
        Closest in your library
      </h2>
      <p className="mb-3 text-xs uppercase tracking-wider text-white/40">{world.register.lexicon[0] ?? "your taste"}</p>
      <ul className="flex flex-wrap gap-2">
        {anchors.map((a) => (
          <li
            key={`${a.mediaType}:${a.tmdbId}`}
            className="rounded-full border border-white/[0.08] px-3 py-1 text-sm text-white/70"
          >
            <Link
              to={`/title/${a.mediaType}/${a.tmdbId}`}
              className="hover:text-white/90"
            >
              {a.title}
              {a.rating != null && <span className="ml-1 text-white/40">· {a.rating}/10</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
