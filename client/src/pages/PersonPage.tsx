import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Cake, Clapperboard, MapPin, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { backdrop, profile } from "../lib/img";
import { Carousel } from "../components/Carousel";
import { PosterCard } from "../components/PosterCard";
import { PosterSkeletonRow } from "../components/Bits";
import type { CatalogItem, PersonDetails } from "../lib/types";

function age(birthday: string | null, deathday: string | null): number | null {
  if (!birthday) return null;
  const end = deathday ? new Date(deathday) : new Date();
  const b = new Date(birthday);
  let a = end.getFullYear() - b.getFullYear();
  const m = end.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < b.getDate())) a--;
  return a;
}

function Biography({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const paragraphs = text.split(/\n+/).filter(Boolean);
  // length-based, not paragraph-count-based — a single long TMDB paragraph
  // still gets clamped and gets the toggle
  const clampable = text.length > 420 || paragraphs.length > 2;
  return (
    <div className="max-w-[68ch]">
      <div className={!expanded && clampable ? "line-clamp-6" : undefined}>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className={`text-[0.95rem] leading-[1.75] text-mist-300 [text-wrap:pretty] ${i > 0 ? "mt-3" : ""}`}
          >
            {p}
          </p>
        ))}
      </div>
      {clampable && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 cursor-pointer text-sm font-medium text-gold-400 transition hover:text-gold-300"
        >
          {expanded ? "Show less" : "Read full biography"}
        </button>
      )}
    </div>
  );
}

type Tab = "acting" | "directing" | "writing";

function Filmography({ person }: { person: PersonDetails }) {
  const tabs = useMemo(() => {
    const t: { key: Tab; label: string; items: CatalogItem[] }[] = [];
    if (person.actingCredits.length)
      t.push({ key: "acting", label: `Acting · ${person.actingCredits.length}`, items: person.actingCredits });
    if (person.directingCredits.length)
      t.push({ key: "directing", label: `Directing · ${person.directingCredits.length}`, items: person.directingCredits });
    if (person.writingCredits.length)
      t.push({ key: "writing", label: `Writing · ${person.writingCredits.length}`, items: person.writingCredits });
    return t;
  }, [person]);

  const defaultTab: Tab =
    person.knownForDepartment === "Directing" && person.directingCredits.length
      ? "directing"
      : (tabs[0]?.key ?? "acting");
  const [tab, setTab] = useState<Tab>(defaultTab);
  const active = tabs.find((t) => t.key === tab) ?? tabs[0];
  if (!active) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-0.5">Every credit, every era</p>
          <h2 className="font-display text-xl font-semibold text-mist-200">
            Filmography
          </h2>
        </div>
        {tabs.length > 1 && (
          <div className="flex gap-1.5" role="tablist" aria-label="Credit type">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`pill ${tab === t.key ? "pill-active" : ""}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(138px,1fr))] gap-x-4 gap-y-7 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
        {active.items.map((i) => (
          <PosterCard key={`${i.mediaType}${i.tmdbId}`} item={i} width="w-full" />
        ))}
      </div>
    </section>
  );
}

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const personId = Number(id);

  const q = useQuery({
    queryKey: ["person", personId],
    queryFn: () => api.person(personId),
    enabled: Number.isFinite(personId),
  });

  if (q.isLoading) {
    return (
      <div>
        <div className="skeleton mb-8 h-[280px] w-full rounded-3xl" />
        <PosterSkeletonRow />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="py-20 text-center text-mist-400">
        <p className="mb-4">{(q.error as Error)?.message ?? "Person not found."}</p>
        <button type="button" className="btn-ghost mx-auto" onClick={() => q.refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const person = q.data;
  const portrait = profile(person.profilePath);
  const heroBackdrop = backdrop(person.knownFor[0]?.backdropPath, "w1280");
  const personAge = age(person.birthday, person.deathday);
  const inYourLibrary = [
    ...person.actingCredits,
    ...person.directingCredits,
    ...person.writingCredits,
  ].filter((c) => c.inLibrary);
  const librarySeen = [
    ...new Map(inYourLibrary.map((i) => [`${i.mediaType}${i.tmdbId}`, i])).values(),
  ];

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          window.history.length > 2 ? navigate(-1) : navigate("/")
        }
        className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-mist-400 transition hover:text-gold-300"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero — portrait against their most iconic backdrop */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="relative mb-10 overflow-hidden rounded-3xl ring-1 ring-white/10"
      >
        {heroBackdrop && (
          <img
            src={heroBackdrop}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/40" />

        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="h-36 w-36 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/20 shadow-2xl sm:h-44 sm:w-44"
          >
            {portrait ? (
              <img
                src={portrait}
                alt={person.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-ink-700 font-display text-5xl text-mist-400">
                {person.name[0]}
              </div>
            )}
          </motion.div>

          <div className="min-w-0">
            <h1 className="font-display text-4xl font-semibold leading-tight text-white [text-wrap:balance] sm:text-5xl">
              {person.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-mist-300">
              {person.knownForDepartment && (
                <span className="flex items-center gap-1.5">
                  <Clapperboard className="h-4 w-4 text-gold-400" />
                  {person.knownForDepartment}
                </span>
              )}
              {person.birthday && (
                <span className="flex items-center gap-1.5">
                  <Cake className="h-4 w-4 text-gold-400" />
                  {person.birthday}
                  {personAge != null &&
                    (person.deathday
                      ? ` — ${person.deathday} (${personAge})`
                      : ` (${personAge})`)}
                </span>
              )}
              {person.placeOfBirth && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gold-400" />
                  {person.placeOfBirth}
                </span>
              )}
            </div>
            {librarySeen.length > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-gold-300">
                <Sparkles className="h-4 w-4" />
                {librarySeen.length} title{librarySeen.length === 1 ? "" : "s"} in
                your archive
              </p>
            )}
          </div>
        </div>
      </motion.section>

      {person.biography && (
        <section className="mb-10">
          <Biography key={person.id} text={person.biography} />
        </section>
      )}

      {librarySeen.length > 0 && (
        <Carousel title="Your history together" eyebrow="From your archive">
          {librarySeen.map((i) => (
            <PosterCard key={`${i.mediaType}${i.tmdbId}`} item={i} />
          ))}
        </Carousel>
      )}

      {person.knownFor.length > 0 && (
        <Carousel title="Known for" eyebrow="The essential work">
          {person.knownFor.map((i) => (
            <PosterCard key={`${i.mediaType}${i.tmdbId}`} item={i} />
          ))}
        </Carousel>
      )}

      <Filmography key={person.id} person={person} />
    </div>
  );
}
