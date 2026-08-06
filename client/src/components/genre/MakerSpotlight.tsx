interface Props {
  director: string | null;
  directorId: number | null;
  title: string;
}

/**
 * Maker spotlight (v1 module `maker`). Surfaces the filmmaker behind a title —
 * the "who made this" thread that differentiates auteur genres (western, anime,
 * noir, comedy). Graceful when director is unknown.
 */
export function MakerSpotlight({ director }: Props) {
  if (!director) return null;
  return (
    <section aria-label="Maker" className="space-y-1">
      <h3 className="text-xs tracking-tight text-mist-300">Maker</h3>
      <p className="text-sm text-white/80">{director}</p>
    </section>
  );
}
