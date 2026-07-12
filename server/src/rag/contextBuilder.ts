import type { DB } from "../db/connection.js";
import { computeTasteProfile, renderTasteProfile } from "./tasteProfile.js";
import { renderLibraryMatches, retrieveLibrary } from "./retrieval.js";
import { renderMemory, retrieveMemory } from "./memory.js";

/**
 * RAG · Context builder.
 * Assembles the three retrieval layers into a token-budgeted context block
 * that is injected into the system prompt for every turn. Live TMDB data
 * arrives through tool calls (layer 4) during the conversation itself.
 */

const BUDGET = {
  profile: 2600,
  library: 2400,
  memory: 1300,
} as const;

function clip(text: string, budget: number): string {
  if (text.length <= budget) return text;
  return `${text.slice(0, budget - 1).trimEnd()}…`;
}

export interface ChatContext {
  profileText: string;
  libraryText: string;
  memoryText: string;
  /** For persistence/debugging: what the retrieval layers surfaced. */
  meta: {
    libraryMatches: string[];
    memoryHits: number;
    librarySize: number;
  };
}

export function buildChatContext(
  db: DB,
  userMessage: string,
  conversationId: number,
): ChatContext {
  const profile = computeTasteProfile(db);
  const matches = retrieveLibrary(db, userMessage, 10);
  const memory = retrieveMemory(db, userMessage, conversationId, 5);

  return {
    profileText: clip(renderTasteProfile(profile), BUDGET.profile),
    libraryText: clip(renderLibraryMatches(matches), BUDGET.library),
    memoryText: clip(renderMemory(memory), BUDGET.memory),
    meta: {
      libraryMatches: matches.map((m) => m.title),
      memoryHits: memory.length,
      librarySize: profile.librarySize,
    },
  };
}

export function renderContextBlock(ctx: ChatContext): string {
  const parts: string[] = [];
  parts.push(`## The user's taste profile (from their local library)\n${ctx.profileText}`);
  if (ctx.libraryText) {
    parts.push(
      `## Library entries relevant to this message\n${ctx.libraryText}`,
    );
  }
  if (ctx.memoryText) {
    parts.push(`## Relevant moments from earlier conversations\n${ctx.memoryText}`);
  }
  return parts.join("\n\n");
}
