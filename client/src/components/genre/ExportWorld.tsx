import { useState } from "react";
import { SectionHead } from "./SectionHead.js";

export interface ExportTitle {
  title: string;
  year?: number;
}

interface Props {
  slug: string;
  /** The hero hook (introData.hook) for this world. */
  hook?: string;
  /** The steered/selected titles to capture. */
  titles: ExportTitle[];
  /** Per-title annotations (thesis lines) keyed by tmdbId. */
  annotations?: Record<number, string>;
}

interface SavedNote {
  slug: string;
  markdown: string;
  savedAt: string;
}

const NOTES_KEY = "lumina:notes";

function buildMarkdown(
  slug: string,
  hook: string | undefined,
  titles: ExportTitle[],
  annotations: Record<number, string>,
): string {
  const lines: string[] = [];
  lines.push(`# ${slug} — curated world`);
  if (hook) {
    lines.push("");
    lines.push(`> ${hook}`);
  }
  lines.push("");
  lines.push(`## Titles (${titles.length})`);
  titles.forEach((t, i) => {
    const year = t.year != null ? ` (${t.year})` : "";
    lines.push(`${i + 1}. ${t.title}${year}`);
    const ann = annotations[i];
    if (ann) lines.push(`   - ${ann}`);
  });
  lines.push("");
  return lines.join("\n");
}

/**
 * ExportWorld (Task 6.8 / C6).
 *
 * Captures the world's hero hook + the selected titles + their annotations as
 * a Markdown note into the localStorage `lumina:notes` array, and offers a
 * printable view of the exported world. Pure client-side; no server touch.
 */
export function ExportWorld({ slug, hook, titles, annotations = {} }: Props) {
  const [saved, setSaved] = useState<SavedNote | null>(null);
  const [printable, setPrintable] = useState(false);

  const save = () => {
    const markdown = buildMarkdown(slug, hook, titles, annotations);
    const note: SavedNote = { slug, markdown, savedAt: new Date().toISOString() };
    let notes: SavedNote[] = [];
    try {
      const raw = localStorage.getItem(NOTES_KEY);
      if (raw) notes = JSON.parse(raw);
    } catch {
      notes = [];
    }
    if (!Array.isArray(notes)) notes = [];
    notes.unshift(note);
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    setSaved(note);
    setPrintable(false);
  };

  const markdown = saved?.markdown ?? buildMarkdown(slug, hook, titles, annotations);

  return (
    <section aria-label="Export world" className="space-y-3">
      <div className="flex items-center gap-3">
        <SectionHead className="flex-1 mb-0">Export</SectionHead>
        <button
          type="button"
          onClick={save}
          data-testid="export-save-note"
          className="world-accent-fill rounded-full px-4 py-1.5 text-2xs font-medium text-ink-950"
        >
          Save note
        </button>
        <button
          type="button"
          onClick={() => setPrintable((p) => !p)}
          className="rounded-full bg-white/[0.06] px-3 py-1.5 text-2xs font-medium text-white/70 ring-1 ring-white/10"
        >
          Printable
        </button>
      </div>

      {saved && (
        <p className="text-2xs text-[var(--world-accent)]/80" data-testid="export-saved">
          Note saved to {NOTES_KEY}.
        </p>
      )}

      {printable && (
        <pre
          data-testid="export-printable"
          className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-white/5 p-4 text-xs text-white/80"
        >
          {markdown}
        </pre>
      )}
    </section>
  );
}
