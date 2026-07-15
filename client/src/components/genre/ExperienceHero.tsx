import type { GenreWorld } from "../../lib/genreWorld.js";

interface Props {
  slug: string;
  world: GenreWorld;
}

export function ExperienceHero({ slug, world }: Props) {
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-amber-400/[0.08] via-white/[0.02] to-transparent p-6 sm:p-10">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-300/70">{world.metaphor}</p>
      <h1 className="mt-2 font-[var(--font-display)] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        {name}
      </h1>
      <p className="mt-3 max-w-xl font-[var(--font-sans)] text-base text-white/60">{world.register.tonePrompt}</p>
    </header>
  );
}
