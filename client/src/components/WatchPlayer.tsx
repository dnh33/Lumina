import { Shield, ShieldAlert, Loader2 } from "lucide-react";
import { backdrop } from "../lib/img";

/**
 * The playback surface: a sandboxed cross-origin iframe. The src is always
 * a server-validated https URL (never built client-side), and untrusted
 * sources get a strict sandbox — scripts run, but no same-origin DOM
 * access and no popups. The badge names the host this play contacts.
 *
 * Aesthetic: the iframe sits over a blurred backdrop + scrim so the
 * frame never reads as a bare black box while loading, and the gold/ink
 * palette matches the rest of Lumina.
 */
export function WatchPlayer({
  url,
  trusted,
  title,
  backdropPath,
}: {
  url: string;
  trusted: boolean;
  title: string;
  backdropPath?: string | null;
}) {
  const host = new URL(url).host;
  const bg = backdrop(backdropPath, "w1280");

  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl">
      {/* Backdrop scrim behind the (transparent-loading) iframe. */}
      {bg && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-30 blur-xl"
          style={{ backgroundImage: `url(${bg})` }}
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent"
      />

      <div className="relative flex aspect-video items-center justify-center">
        <iframe
          src={url}
          title={`${title} player`}
          sandbox={
            trusted ? "allow-scripts allow-same-origin" : "allow-scripts"
          }
          referrerPolicy="no-referrer-when-downgrade"
          allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *"
          allowFullScreen
          className="h-full w-full bg-ink-950"
        />
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-2xs text-mist-400">
        {trusted ? (
          <Shield className="h-3 w-3 text-gold-400" />
        ) : (
          <ShieldAlert className="h-3 w-3 text-mist-400" />
        )}
        Playing from <span className="font-medium text-mist-300">{host}</span>
        {!trusted && <span>· sandboxed</span>}
      </p>
    </div>
  );
}

/** Shared loading state for the player region (keeps the aspect box stable). */
export function WatchPlayerLoading({ title }: { title: string }) {
  return (
    <div className="panel flex aspect-video flex-col items-center justify-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
      <p className="text-2xs uppercase tracking-wider text-mist-400">
        Loading {title}…
      </p>
    </div>
  );
}
