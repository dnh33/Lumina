import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Check,
  Compass,
  Database,
  Download,
  EyeOff,
  Flame,
  KeyRound,
  Loader2,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { invalidateLibraryData } from "../lib/invalidate";
import { poster } from "../lib/img";
import { DOCK_CONVERSATION_KEY } from "../lib/keys";
import { playCue, useSound } from "../lib/sound";

function Row({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          ok ? "bg-gold-400/20 text-gold-300" : "bg-red-500/15 text-red-300"
        }`}
      >
        {ok ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
      </span>
      <div>
        <p className="text-sm font-medium text-mist-200">{label}</p>
        <p className="text-xs text-mist-400">{detail}</p>
      </div>
    </div>
  );
}

function SoundSwitch() {
  const { enabled, setEnabled } = useSound();
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/[0.06] pt-4">
      <div>
        <p className="text-sm font-medium text-mist-200">Interface sounds</p>
        <p className="text-xs text-mist-400">
          Quiet synthesized cues for saves and the companion. Respects your
          system's reduced-motion setting.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Interface sounds"
        onClick={() => {
          const next = !enabled;
          setEnabled(next);
          if (next) playCue("toggle");
        }}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${
          enabled ? "bg-gold-400" : "bg-white/[0.1] ring-1 ring-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-ink-950 transition-all ${
            enabled ? "left-[22px]" : "left-0.5 bg-mist-400"
          }`}
        />
      </button>
    </div>
  );
}

function DiscoveryPrefs() {
  const qc = useQueryClient();
  const genres = useQuery({ queryKey: ["tmdb-genres"], queryFn: api.genres });
  const prefs = useQuery({
    queryKey: ["discovery-prefs"],
    queryFn: api.getDiscoveryPrefs,
  });
  const ignored = useQuery({ queryKey: ["ignored"], queryFn: api.ignoredList });

  const savePrefs = useMutation({
    mutationFn: (ids: number[]) => api.setDiscoveryPrefs(ids),
    onSuccess: () => {
      playCue("toggle");
      qc.invalidateQueries({ queryKey: ["discovery-prefs"] });
      invalidateLibraryData(qc);
    },
  });

  const unignore = useMutation({
    mutationFn: (t: { mediaType: "movie" | "tv"; tmdbId: number }) =>
      api.unignore(t.mediaType, t.tmdbId),
    onSuccess: () => {
      playCue("toggle");
      invalidateLibraryData(qc);
    },
  });

  const retiredAnchors = useQuery({
    queryKey: ["retired-anchors"],
    queryFn: api.retiredAnchors,
  });

  const unretire = useMutation({
    mutationFn: (libraryId: number) => api.unretireAnchor(libraryId),
    onSuccess: () => {
      playCue("toggle");
      retiredAnchors.refetch();
      invalidateLibraryData(qc);
    },
  });

  const anchorLogging = useQuery({
    queryKey: ["anchor-logging"],
    queryFn: api.anchorLogging,
  });

  const setLogging = useMutation({
    mutationFn: (enabled: boolean) => api.setAnchorLogging(enabled),
    onSuccess: (data) => {
      playCue(data.enabled ? "toggle" : "success");
      anchorLogging.refetch();
    },
  });

  const clearUsage = useMutation({
    mutationFn: () => api.clearAnchorUsage(),
    onSuccess: () => {
      playCue("success");
      qc.invalidateQueries({ queryKey: ["anchor-logging"] });
      // Over-used ribbons read fatigueScores from anchor_usage — refresh them.
      qc.invalidateQueries({ queryKey: ["anchorRetired"] });
    },
  });

  const resetAll = useMutation({
    mutationFn: async () => {
      for (const t of ignored.data ?? []) {
        await api.unignore(t.mediaType, t.tmdbId);
      }
    },
    onSuccess: () => {
      playCue("success");
      invalidateLibraryData(qc);
    },
  });

  const excluded = new Set(prefs.data?.excludedGenres ?? []);
  const toggleGenre = (id: number) => {
    const next = new Set(excluded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    savePrefs.mutate([...next]);
  };

  return (
    <section className="panel space-y-5 p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-mist-200">
        <Compass className="h-[18px] w-[18px] text-gold-400" /> Discovery preferences
      </h2>

      <div>
        <p className="mb-1 text-sm font-medium text-mist-200">Excluded genres</p>
        <p className="mb-3 text-xs text-mist-400">
          Titles in these genres never appear in trending, search or
          recommendations. Your library is untouched.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {genres.data?.map((g) => (
            <button
              key={g.id}
              type="button"
              data-cuelume-toggle="tick"
              aria-pressed={excluded.has(g.id)}
              disabled={savePrefs.isPending}
              onClick={() => toggleGenre(g.id)}
              className={`pill ${excluded.has(g.id) ? "pill-active" : ""}`}
            >
              {g.name}
            </button>
          ))}
          {genres.isError && (
            <p className="text-sm text-mist-400">
              Couldn't load genres — check the TMDB connection above.
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-4">
        <div className="mb-1 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-mist-200">Comparison tracking</p>
          <button
            type="button"
            role="switch"
            aria-checked={anchorLogging.data?.enabled ?? false}
            disabled={setLogging.isPending || anchorLogging.isLoading}
            onClick={() => setLogging.mutate(!(anchorLogging.data?.enabled ?? false))}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              anchorLogging.data?.enabled ? "bg-gold-400" : "bg-white/15"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink-950 transition-transform ${
                anchorLogging.data?.enabled ? "left-0.5 translate-x-4" : "left-0.5"
              }`}
            />
          </button>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-mist-400">
          Lumina tallies which titles you revisit to vary its suggestions. This
          stays on your device — only a hint reaches the AI, never the raw list.
          Turning it off stops new tracking; use Clear usage data to erase what's
          already recorded.
        </p>
        <button
          type="button"
          disabled={clearUsage.isPending}
          onClick={() => {
            if (
              window.confirm(
                "Erase your comparison tracking history? This cannot be undone.",
              )
            ) {
              clearUsage.mutate();
            }
          }}
          className="btn-ghost"
        >
          {clearUsage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
          ) : (
            <Trash2 className="h-4 w-4 text-gold-400" />
          )}
          Clear usage data
        </button>
      </div>

      <div className="border-t border-white/[0.06] pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-mist-200">Ignored titles</p>
            <p className="text-xs text-mist-400">
              Hidden from every discovery surface until you un-ignore them.
            </p>
          </div>
          {(ignored.data?.length ?? 0) > 0 && (
            <button
              type="button"
              disabled={resetAll.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    `Un-ignore all ${ignored.data?.length} titles? They reappear in discovery immediately.`,
                  )
                ) {
                  resetAll.mutate();
                }
              }}
              className="btn-ghost"
            >
              {resetAll.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
              ) : (
                <EyeOff className="h-4 w-4 text-gold-400" />
              )}
              Reset all ignored
            </button>
          )}
        </div>

        {ignored.data && ignored.data.length > 0 ? (
          <div className="inset-block max-h-72 divide-y divide-white/[0.06] overflow-y-auto">
            {ignored.data.map((t) => (
              <div
                key={`${t.mediaType}:${t.tmdbId}`}
                className="flex items-center gap-3 px-3 py-2"
              >
                {poster(t.posterPath) ? (
                  <img
                    src={poster(t.posterPath)!}
                    alt=""
                    className="h-12 w-8 shrink-0 rounded object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="flex h-12 w-8 shrink-0 items-center justify-center rounded bg-ink-800 ring-1 ring-white/10">
                    <EyeOff className="h-3.5 w-3.5 text-mist-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-mist-200">{t.title}</p>
                  <p className="text-2xs text-mist-400">
                    {[t.year, t.mediaType === "tv" ? "Series" : "Film"]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={unignore.isPending}
                  onClick={() =>
                    unignore.mutate({ mediaType: t.mediaType, tmdbId: t.tmdbId })
                  }
                  className="btn-ghost"
                >
                  Un-ignore
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-mist-400">
            Nothing ignored. Hover any poster for a moment (or tap ⋯) and
            choose Ignore to hide a title from discovery.
          </p>
        )}
      </div>

      <div className="border-t border-white/[0.06] pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-mist-200">Retired anchors</p>
            <p className="text-xs text-mist-400">
              Kept in your taste profile, but no longer used as comparison hooks.
            </p>
          </div>
        </div>

        {retiredAnchors.data && retiredAnchors.data.length > 0 ? (
          <div className="inset-block max-h-72 divide-y divide-white/[0.06] overflow-y-auto">
            {retiredAnchors.data.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-mist-200">{t.title}</p>
                  <p className="text-2xs text-mist-400">
                    {t.mediaType === "tv" ? "Series" : "Film"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={unretire.isPending}
                  onClick={() => unretire.mutate(t.id)}
                  className="btn-ghost"
                >
                  Un-retire
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-mist-400">
            No retired anchors. Use “Retire as anchor” on a poster to stop a
            title from being over-cited as a comparison.
          </p>
        )}
      </div>
    </section>
  );
}

export default function Settings() {
  const qc = useQueryClient();
  const health = useQuery({ queryKey: ["health"], queryFn: api.health });
  const profile = useQuery({ queryKey: ["taste-profile"], queryFn: api.tasteProfile });
  const stats = useQuery({ queryKey: ["library-stats"], queryFn: api.libraryStats });

  const [model, setModel] = useState("");
  const [modelSaved, setModelSaved] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const saveModel = useMutation({
    mutationFn: (m: string) => api.setModel(m),
    onSuccess: () => {
      playCue("chime");
      qc.invalidateQueries({ queryKey: ["health"] });
      setModelError(null);
      setModelSaved(true);
      setTimeout(() => setModelSaved(false), 1800);
    },
    onError: (e) => setModelError((e as Error).message),
  });

  const [wiped, setWiped] = useState(false);
  const wipeChats = useMutation({
    mutationFn: () => api.deleteAllConversations(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["messages"] });
      localStorage.removeItem(DOCK_CONVERSATION_KEY);
      setWiped(true);
      setTimeout(() => setWiped(false), 2000);
    },
  });

  const [enrichMsg, setEnrichMsg] = useState<string | null>(null);
  const enrich = useMutation({
    mutationFn: () => api.enrichAll(),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["library"] });
      playCue("success");
      if (r.skipped) setEnrichMsg("OMDB_API_KEY isn't set — add it to .env to enable critics.");
      else setEnrichMsg(`Checked ${r.checked} titles · filled ${r.enriched} with IMDb/RT scores.`);
      setTimeout(() => setEnrichMsg(null), 5000);
    },
    onError: (e) => {
      setEnrichMsg(`Couldn't refresh — ${(e as Error).message}`);
      setTimeout(() => setEnrichMsg(null), 5000);
    },
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [importReport, setImportReport] = useState<
    { input: string; matched: string | null; status: string; detail?: string }[] | null
  >(null);
  const importCsv = useMutation({
    mutationFn: (csv: string) => api.importCsv(csv),
    onSuccess: (report) => {
      playCue("success");
      setImportReport(report);
      qc.invalidateQueries({ queryKey: ["library"] });
      qc.invalidateQueries({ queryKey: ["library-stats"] });
    },
  });

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    importCsv.mutate(await f.text());
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 font-display text-3xl font-semibold text-mist-200">
        Settings
      </h1>
      <p className="mb-8 text-sm text-mist-400">
        Keys live in the .env file at the repo root; everything else lives in
        your local database.
      </p>

      <div className="space-y-6">
        {/* Status */}
        <section className="panel space-y-4 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-mist-200">
            <KeyRound className="h-[18px] w-[18px] text-gold-400" /> Connections
          </h2>
          {health.data && (
            <>
              <Row
                ok={health.data.tmdbConfigured}
                label="TMDB metadata"
                detail={
                  health.data.tmdbConfigured
                    ? "Posters, synopses, cast and discovery are live."
                    : "Add TMDB_ACCESS_TOKEN to .env (free at themoviedb.org) and restart."
                }
              />
              <Row
                ok={health.data.aiConfigured}
                label="AI companion (OpenRouter)"
                detail={
                  health.data.aiConfigured
                    ? `Conversations powered by ${health.data.model}.`
                    : "Add OPENROUTER_API_KEY to .env (openrouter.ai/keys) and restart."
                }
              />
              <Row
                ok
                label={`Watch providers · ${health.data.watchRegion}`}
                detail={`Streaming availability shown for region ${health.data.watchRegion}. Change WATCH_REGION in .env (e.g. US, GB, SE).`}
              />
            </>
          )}

          <div className="border-t border-white/[0.06] pt-4">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-mist-400">
              Chat model (any OpenRouter slug)
            </p>
            <div className="flex gap-2">
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={health.data?.model ?? "anthropic/claude-sonnet-5"}
                className="flex-1 rounded-xl bg-ink-800/80 px-3.5 py-2.5 text-sm text-mist-200 placeholder-mist-400/60 outline-none ring-1 ring-white/10 transition focus:ring-gold-400/50"
              />
              <button
                type="button"
                disabled={!model.trim() || saveModel.isPending}
                onClick={() => saveModel.mutate(model.trim())}
                className="btn-primary"
              >
                {modelSaved ? "Saved ✦" : "Save"}
              </button>
            </div>
            {modelError && (
              <p className="mt-2 text-sm text-red-300/90">
                Couldn't save — {modelError}
              </p>
            )}
            <p className="mt-2 text-2xs text-mist-400">
              Try anthropic/claude-sonnet-5 for the finest conversation, or a
              cheaper slug for casual browsing. Heads-up: the chat needs a
              model with tool-calling support.
            </p>
          </div>

          <SoundSwitch />
        </section>

        {/* Discovery preferences */}
        <DiscoveryPrefs />

        {/* What the AI sees */}
        <section className="panel p-6">
          <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-mist-200">
            <Brain className="h-[18px] w-[18px] text-gold-400" /> What the AI knows about you
          </h2>
          <p className="mb-4 text-xs text-mist-400">
            The live taste profile assembled from your library — this exact
            text grounds every conversation.
          </p>
          {profile.isLoading ? (
            <div className="skeleton h-40 rounded-xl" />
          ) : profile.isError ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-mist-400">Couldn't load the profile.</p>
              <button type="button" className="btn-ghost" onClick={() => profile.refetch()}>
                Retry
              </button>
            </div>
          ) : (
            <pre className="inset-block max-h-72 overflow-y-auto whitespace-pre-wrap p-4 font-sans text-[0.82rem] leading-relaxed text-mist-300">
              {profile.data?.rendered?.trim() ||
                "Your taste profile appears once you log and rate a few titles."}
            </pre>
          )}
        </section>

        {/* Data */}
        <section className="panel space-y-5 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-mist-200">
            <Database className="h-[18px] w-[18px] text-gold-400" /> Your data
          </h2>
          {stats.data && (
            <p className="text-sm text-mist-400">
              {stats.data.total} titles · {stats.data.episodesWatched} episodes
              tracked · ≈{stats.data.estimatedHours} hours of viewing — all in
              a single SQLite file on your machine
              {health.data?.dataDir ? (
                <span className="mt-1 block truncate font-mono text-2xs text-mist-400">
                  {health.data.dataDir}
                </span>
              ) : null}
            </p>
          )}
          <div className="flex flex-wrap gap-2.5">
            <a href="/api/export" download className="btn-ghost">
              <Download className="h-4 w-4 text-gold-400" /> Export everything (JSON)
            </a>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-ghost"
            >
              {importCsv.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
              ) : (
                <Upload className="h-4 w-4 text-gold-400" />
              )}
              Import watch history (CSV)
            </button>
            <button
              type="button"
              disabled={enrich.isPending}
              onClick={() => enrich.mutate()}
              className="btn-ghost"
            >
              {enrich.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
              ) : (
                <Star className="h-4 w-4 text-gold-400" />
              )}
              Refresh critics (IMDb · RT)
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              aria-label="Choose CSV file to import"
              className="hidden"
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = ""; // re-selecting the same file must work
              }}
            />
          </div>
          {enrichMsg && (
            <p className="text-sm text-gold-300/90">{enrichMsg}</p>
          )}
          <p className="text-2xs leading-relaxed text-mist-400">
            CSV columns: title, year, type (movie/tv), rating (1–10), status,
            notes — only the title is required. Each row is matched against
            TMDB automatically.
          </p>

          {importReport && (
            <div className="inset-block max-h-56 overflow-y-auto p-3">
              <p className="mb-2 border-b border-white/[0.06] pb-2 text-xs font-semibold text-mist-200">
                {importReport.filter((r) => r.status === "added").length} added ·{" "}
                {importReport.filter((r) => r.status === "skipped").length} skipped ·{" "}
                {importReport.filter((r) => r.status !== "added" && r.status !== "skipped").length}{" "}
                failed
              </p>
              {importReport.map((r, i) => (
                <p key={i} className="py-0.5 text-xs">
                  <span
                    className={
                      r.status === "added"
                        ? "text-gold-300"
                        : r.status === "skipped"
                          ? "text-mist-400"
                          : "text-red-300"
                    }
                  >
                    {r.status}
                  </span>{" "}
                  <span className="text-mist-300">{r.input}</span>
                  {r.matched && r.matched !== r.input && (
                    <span className="text-mist-400"> → {r.matched}</span>
                  )}
                  {r.detail && <span className="text-mist-400"> ({r.detail})</span>}
                </p>
              ))}
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="panel space-y-4 p-6 ring-red-500/15">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-mist-200">
            <Flame className="h-[18px] w-[18px] text-red-300" /> Danger zone
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={wipeChats.isPending}
              onClick={() => {
                if (
                  window.confirm(
                    "Delete ALL conversations? The AI loses its conversational memory (your library, ratings, notes and tags are untouched).",
                  )
                ) {
                  wipeChats.mutate();
                }
              }}
              className="btn-ghost hover:bg-red-500/15 hover:text-red-300"
            >
              {wipeChats.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {wiped ? "Cleared" : "Delete all conversations"}
            </button>
            {wipeChats.isError && (
              <p className="text-sm text-red-300/90">
                {(wipeChats.error as Error).message}
              </p>
            )}
          </div>
          <p className="text-2xs leading-relaxed text-mist-400">
            Removes every chat and its memory index. Your library database
            stays exactly as it is.
          </p>
        </section>
      </div>
    </div>
  );
}
