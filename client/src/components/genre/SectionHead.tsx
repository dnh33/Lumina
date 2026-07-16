import type { ReactNode } from "react";

interface SectionHeadProps {
  /** The section's name. */
  children: ReactNode;
  /** Optional id for aria-labelledby wiring. */
  id?: string;
  className?: string;
}

/**
 * Instrument Ink section head: one coherent treatment — a serif display title
 * (the "felt" register) above a hairline etched rule. No mono label voice
 * (slop.md: monospace-as-house-voice is a tell); labels that are genuinely
 * data use the ghost numeral, not a tracked-caps costume.
 */
export function SectionHead({ children, id, className = "" }: SectionHeadProps) {
  return (
    <div className={`mb-3 ${className}`}>
      <hr className="etched-rule mb-2" />
      <h3 id={id} className="font-[var(--font-display)] text-sm font-semibold tracking-tight text-mist-200">
        {children}
      </h3>
    </div>
  );
}
