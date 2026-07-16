import { useNavigate } from "react-router-dom";
import { getGenreWorld, type GenreWorld } from "../../lib/genreWorld.js";

interface NeighborRailProps {
  world: GenreWorld;
}

/**
 * Task 5.1 (C1) — cross-world warp.
 *
 * Renders a compact "Neighboring worlds" rail of chips that warp the user to
 * each adjacent world (per `world.register.adjacency`). If the world has no
 * adjacency, the rail renders nothing (graceful no-op — no empty heading).
 */
export function NeighborRail({ world }: NeighborRailProps) {
  const navigate = useNavigate();
  const neighbors = world.register.adjacency ?? [];

  if (neighbors.length === 0) return null;

  return (
    <nav aria-label="Neighboring worlds" className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10">
      <h2 className="mb-2 text-2xs font-medium uppercase tracking-wider text-mist-500">
        Neighboring worlds
      </h2>
      <ul className="flex flex-wrap items-center gap-2">
        {neighbors.map((slug) => {
          const neighbor = getGenreWorld(slug);
          return (
            <li key={slug}>
              <button
                type="button"
                onClick={() => navigate(`/genre/${slug}`)}
                className="rounded-full bg-white/[0.05] px-3 py-1 text-sm text-mist-200 ring-1 ring-white/10 transition-colors hover:bg-white/[0.1] hover:text-mist-100"
              >
                {neighbor.slug === slug ? neighborSlugLabel(slug) : slug}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Human-ish label fallback for a slug (handles hyphenated worlds). */
function neighborSlugLabel(slug: string): string {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
