import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Check,
  Database,
  Download,
  Flame,
  KeyRound,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { api } from "../lib/api";
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
