interface Props {
  /** Accent color (hex) used to faintly tint the node lines + dots. */
  accent: string;
}

// Deterministic pseudo-random node positions (0..100) so the backdrop is
// stable across renders — no Math.random, no graph engine, just a decorative
// constellation of faint dots + connecting lines (design §92 flagship scope).
const NODES: Array<{ x: number; y: number }> = [
  { x: 8, y: 18 },
  { x: 22, y: 42 },
  { x: 35, y: 12 },
  { x: 48, y: 55 },
  { x: 60, y: 28 },
  { x: 72, y: 62 },
  { x: 84, y: 20 },
  { x: 90, y: 48 },
  { x: 15, y: 70 },
  { x: 40, y: 80 },
  { x: 66, y: 82 },
  { x: 54, y: 38 },
];

// Edges connect each node to the next one or two to suggest a faint web.
const EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 6],
  [5, 7],
  [0, 8],
  [3, 9],
  [5, 10],
  [4, 11],
  [1, 11],
  [6, 7],
];

/**
 * Purely DECORATIVE constellation backdrop for the Constellation flagship
 * layout (Task 4.1). It draws faint node dots + connecting lines behind the
 * cards — it is NOT a graph engine (design §92 correction): no data, no
 * links, no interactivity. Decorative only.
 */
export function ConstellationBackdrop({ accent }: Props) {
  return (
    <svg
      aria-hidden="true"
      data-testid="constellation-backdrop"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-[0.18]"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 100 100"
    >
      <g stroke={accent} strokeWidth="0.3" fill="none">
        {EDGES.map(([a, b], i) => (
          <line
            key={`e-${i}`}
            x1={NODES[a].x}
            y1={NODES[a].y}
            x2={NODES[b].x}
            y2={NODES[b].y}
          />
        ))}
      </g>
      <g fill={accent} className="constellation-web">
        {NODES.map((n, i) => (
          <circle key={`n-${i}`} cx={n.x} cy={n.y} r={i % 4 === 0 ? 0.9 : 0.5} />
        ))}
      </g>
    </svg>
  );
}
