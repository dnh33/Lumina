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
