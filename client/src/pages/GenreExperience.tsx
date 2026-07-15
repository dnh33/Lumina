import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getGenreWorld } from "../lib/genreWorld.js";
import { Carousel } from "../components/Carousel.js";
import { PosterCard } from "../components/PosterCard.js";
import { ExperienceHero } from "../components/genre/ExperienceHero.js";
import { AnchorFrame } from "../components/genre/AnchorFrame.js";
import { GenreModules } from "../components/genre/GenreModules.js";

export default function GenreExperience() {
  const { slug = "documentary" } = useParams<{ slug: string }>();
  const world = getGenreWorld(slug);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["genre-experience", slug],
    queryFn: () => api.genreExperience([slug]),
  });

  const navigate = useNavigate();
  const openGuided = () => {
    const hook = data?.intro?.hook;
    navigate("/chat", {
      state: {
        prefill: hook
          ? `${hook} Take me deeper into the ${slug} world — what should I watch next and why?`
          : `Walk me into the ${slug} world. What should I watch next and why?`,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-40 animate-pulse rounded-3xl bg-white/[0.04]" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-white/60">
        Couldn&rsquo;t open this world right now.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <ExperienceHero slug={slug} world={world} />

      <AnchorFrame anchors={data.anchorsUsed} world={world} />

      <GenreModules modules={world.modules} items={data.items} />

      <Carousel title="For You in this World" eyebrow="Seeded by the genre you chose">
        {data.items.map((it) => (
          <PosterCard key={`${it.mediaType}:${it.tmdbId}`} item={it} width="w-full" />
        ))}
      </Carousel>

      {data.intro?.hook && (
        <button
          onClick={openGuided}
          className="rounded-full bg-amber-400/90 px-5 py-2.5 text-sm font-medium text-ink-950 transition-colors hover:bg-amber-300"
        >
          Explore with the Companion
        </button>
      )}
    </div>
  );
}
