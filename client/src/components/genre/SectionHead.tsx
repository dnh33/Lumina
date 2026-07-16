import type { ReactNode } from "react";

interface SectionHeadProps {
  /** The section's name or label. */
  children: ReactNode;
  /** `title`   — a named section (Marathon, Filmmakers…): serif display, felt.
   *  `readout` — a data/era label (Sort, Media type…): mono, trusted. */
  variant?: "title" | "readout";
  /** Optional id for aria-labelledby wiring. */
  id?: string;
  className?: string;
}

/**
 * Instrument Ink section head. One coherent treatment, two registers so the
 * page reads as a system instead of one repeated tracked-caps label (the
 * anti-slop "one label treatment everywhere" tell). A hairline etched rule
 * sits above — an etched bezel line, not a hard divider.
 */
export function SectionHead({ children, variant = "title", id, className = "" }: SectionHeadProps) {
  const cls =
    variant === "readout"
      ? "readout"
      : "font-[var(--font-display)] text-sm font-semibold tracking-tight text-mist-200";
  return (
    <div className={`mb-3 ${className}`}>
      <hr className="etched-rule mb-2" />
      <h3 id={id} className={cls}>
        {children}
      </h3>
    </div>
  );
}
