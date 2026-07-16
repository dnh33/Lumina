import { useNavigate } from "react-router-dom";
import { SectionHead } from "./SectionHead.js";
import { GENRE_WORLDS } from "../../lib/genreWorld.js";

/**
 * Task 5.1 (C1) — cross-world warp.
 *
 * A small, decorative SVG graph of every world. Nodes = all GENRE_WORLDS
 * (id = slug); edges = adjacency pairs. Clicking a node warps to /genre/:slug.
 * No external graph lib — plain SVG positioned on a simple radial layout.
 * aria-label'd so it is announced as a worlds map, and the SVG itself is
 * aria-hidden (the NavRail provides the real navigation surface).
 */
export function WorldsMap() {
  const navigate = useNavigate();
  const worlds = Object.values(GENRE_WORLDS);
  const slugToWorld = new Map(worlds.map((w) => [w.slug, w]));

  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 26;

  // place nodes on a circle
  const positions = new Map<string, { x: number; y: number }>();
  worlds.forEach((w, i) => {
    const angle = (i / worlds.length) * Math.PI * 2 - Math.PI / 2;
    positions.set(w.slug, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });

  // unique edges from adjacency
  const edges = new Set<string>();
  const edgeList: Array<{ a: string; b: string }> = [];
  for (const w of worlds) {
    for (const adj of w.register.adjacency ?? []) {
      if (!slugToWorld.has(adj)) continue;
      const key = [w.slug, adj].sort().join("|");
      if (edges.has(key)) continue;
      edges.add(key);
      edgeList.push({ a: w.slug, b: adj });
    }
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10">
      <SectionHead variant="readout">Worlds map</SectionHead>
      <svg
        role="img"
        aria-label="Map of all genre worlds; edges connect neighboring worlds. Click a node to warp to that world."
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto block h-72 w-72"
      >
        {edgeList.map(({ a, b }) => {
          const pa = positions.get(a)!;
          const pb = positions.get(b)!;
          return (
            <line
              key={`${a}|${b}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke="currentColor"
              className="text-white/15"
              strokeWidth={1}
            />
          );
        })}
        {worlds.map((w) => {
          const p = positions.get(w.slug)!;
          return (
            <g
              key={w.slug}
              data-testid={`node-${w.slug}`}
              className="cursor-pointer"
              onClick={() => navigate(`/genre/${w.slug}`)}
              role="button"
              aria-label={`Warp to the ${w.slug} world`}
            >
              <circle cx={p.x} cy={p.y} r={10} fill={w.register.accent} />
              <text
                x={p.x}
                y={p.y - 14}
                textAnchor="middle"
                className="fill-mist-300 text-[7px]"
              >
                {w.slug}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
