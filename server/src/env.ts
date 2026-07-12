import fs from "node:fs";
import path from "node:path";

/**
 * Zero-dependency .env loader + typed config.
 * Looks for `.env` starting at cwd and walking up (so it works whether the
 * server is started from the repo root or from server/).
 */

function findUp(fileName: string, startDir: string): string | null {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, fileName);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function findRepoRoot(startDir = process.cwd()): string {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const pkg = path.join(dir, "package.json");
    if (fs.existsSync(pkg)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(pkg, "utf8"));
        if (parsed.name === "lumina") return dir;
      } catch {
        /* ignore malformed package.json */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

function loadDotEnv(): void {
  const envPath = findUp(".env", process.cwd());
  if (!envPath) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv();

const repoRoot = findRepoRoot();

export const env = {
  repoRoot,
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? "127.0.0.1",
  tmdbAccessToken: process.env.TMDB_ACCESS_TOKEN ?? "",
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  openRouterModel: process.env.OPENROUTER_MODEL ?? "anthropic/claude-sonnet-5",
  watchRegion: process.env.WATCH_REGION ?? "DK",
  dbPath:
    process.env.LUMINA_DB ?? path.join(repoRoot, "data", "lumina.db"),
  isProd: process.env.NODE_ENV === "production",
};

export type Env = typeof env;
