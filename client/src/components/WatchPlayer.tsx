import { Shield, ShieldAlert } from "lucide-react";

/**
 * The playback surface: a sandboxed cross-origin iframe. The src is always
 * a server-validated https URL (never built client-side), and untrusted
 * sources get a strict sandbox — scripts run, but no same-origin DOM
 * access and no popups. The badge names the host this play contacts.
 */
export function WatchPlayer({
  url,
  trusted,
  title,
}: {
  url: string;
  trusted: boolean;
  title: string;
}) {
  const host = new URL(url).host;
  return (
    <div>
      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl">
        <iframe
          src={url}
          title={`${title} player`}
          sandbox={
            trusted ? "allow-scripts allow-same-origin" : "allow-scripts"
          }
          referrerPolicy="no-referrer-when-downgrade"
          allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *"
          allowFullScreen
          className="aspect-video w-full bg-ink-950"
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
