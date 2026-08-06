interface Props {
  /** Accent color (hex) used to faintly tint the spine gradient + node ticks. */
  accent: string;
}

/**
 * Purely DECORATIVE vertical "geo-spine" for the Frontier flagship layout
 * (Task 4.1). A faint gradient line down the left edge with occasional node
 * ticks — evokes a trail / frontier path. Decorative only: no data, no
 * interactivity (design §188-190).
 */
export function FrontierSpine({ accent }: Props) {
  return (
    <svg
      aria-hidden="true"
      data-testid="frontier-spine"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-[0.22]"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <defs>
        <linearGradient id="frontier-spine-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.1" />
          <stop offset="50%" stopColor={accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <line
        x1="10"
        y1="0"
        x2="10"
        y2="100"
        stroke="url(#frontier-spine-grad)"
        strokeWidth="0.8"
      />
      <g fill={accent}>
        {[12, 30, 48, 66, 84].map((y) => (
          <circle key={`tick-${y}`} cx="10" cy={y} r="1.1" />
        ))}
      </g>
    </svg>
  );
}
