/**
 * URL-builder for user-supplied watch-source templates. Pure: substitutes
 * `{id}`/`{s}`/`{e}` into a template from the local (never committed)
 * sources file and validates the result. It NEVER fetches the URL — the
 * client loads it directly in a sandboxed iframe, so there is no proxy
 * and no SSRF surface here.
 */

export type BuildResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export interface BuildVars {
  id: number | string;
  s?: number | string;
  e?: number | string;
}

export function buildUrl(template: string, vars: BuildVars): BuildResult {
  // Parse-time rules: https-only (kills javascript:/data:/http:/relative)
  // and no whitespace/control/HTML chars smuggled into the template.
  if (!template.startsWith("https://")) {
    return { ok: false, error: "template must be an https:// URL" };
  }
  for (const ch of template) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= 0x20 || '<>"\'`'.includes(ch)) {
      return { ok: false, error: "template contains invalid characters" };
    }
  }

  let url = template;
  const fill = (token: string, value: number | string | undefined) => {
    if (!url.includes(token)) return true;
    if (value === undefined) return false;
    url = url.replaceAll(token, encodeURIComponent(String(value)));
    return true;
  };
  if (!fill("{id}", vars.id)) return { ok: false, error: "id required" };
  if (!fill("{s}", vars.s)) return { ok: false, error: "season required" };
  if (!fill("{e}", vars.e)) return { ok: false, error: "episode required" };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, error: "built URL is not valid" };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "built URL must be https" };
  }
  return { ok: true, url };
}
