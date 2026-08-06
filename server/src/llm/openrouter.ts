import OpenAI from "openai";
import { env } from "../env.js";
import type { DB } from "../db/connection.js";

export class LlmError extends Error {
  constructor(
    message: string,
    public statusCode = 503,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

let client: OpenAI | null = null;

/** OpenRouter speaks the OpenAI protocol — one client, any model. */
export function getLlm(): OpenAI {
  if (!env.openRouterApiKey) {
    throw new LlmError(
      "OpenRouter API key missing — add OPENROUTER_API_KEY to your .env",
    );
  }
  if (!client) {
    client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: env.openRouterApiKey,
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/dnh33/lumina",
        "X-Title": "Lumina",
      },
    });
  }
  return client;
}

export function getSetting(db: DB, key: string): string | null {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(db: DB, key: string, value: string): void {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, value);
}

/** Model precedence: in-app setting → .env → default. */
export function currentModel(db: DB): string {
  return getSetting(db, "openrouter_model") ?? env.openRouterModel;
}

/**
 * Turn OpenRouter / SDK failures into an actionable companion error.
 * Names the model in use and where to change it — never echoes API keys.
 */
export function formatChatLlmError(err: unknown, model: string): string {
  const raw = err instanceof Error ? err.message : String(err);
  const status =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status?: unknown }).status === "number"
      ? (err as { status: number }).status
      : undefined;

  const looksUnavailable =
    status === 404 ||
    /model.*(unavailable|not found|does not exist)/i.test(raw) ||
    /404/.test(raw);

  if (looksUnavailable) {
    return (
      `OpenRouter rejected model "${model}"` +
      (status ? ` (${status})` : "") +
      `. Set OPENROUTER_MODEL in .env or Settings → Chat model ` +
      `(needs a live slug with tool-calling; :free models often vanish). ` +
      `Raw: ${raw}`
    );
  }

  return raw || "The AI companion is unavailable.";
}
