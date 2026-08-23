import type { DB } from "../db/connection.js";
import {
  findGuidedSessionByConversation,
  renderGuidedSessionContext,
} from "../services/guidedSessionService.js";
import { computeTasteProfile, renderTasteProfile } from "./tasteProfile.js";
import { renderLibraryMatches, retrieveLibrary } from "./retrieval.js";
import { renderMemory, retrieveMemory } from "./memory.js";
import { renderTasteSignals } from "../services/feedbackService.js";
import { getConversationSummary, needsCompression, renderSummary, type ConversationSummary } from "./summarization.js";

/**
 * RAG · Context builder.
 * Assembles the three retrieval layers into a token-budgeted context block
 * that is injected into the system prompt for every turn. Live TMDB data
 * arrives through tool calls (layer 4) during the conversation itself.
 * When the conversation is linked to a Worlds guided session, that tour
 * state is appended as an extra layer (same settings blob — no second store).
 */

const BUDGET = {
  profile: 2600,
  library: 2400,
  memory: 1300,
  guided: 1200,
} as const;

function clip(text: string, budget: number): string {
  if (text.length <= budget) return text;
  return `${text.slice(0, budget - 1).trimEnd()}…`;
}

export interface ChatContext {
  profileText: string;
  libraryText: string;
  memoryText: string;
  /** Worlds guided tour, when this conversation is linked to a session. */
  guidedText: string;
  /** Rolling summary from older turns (when history exceeds HISTORY_LIMIT). */
  summaryText: string;
  /** Stated taste signals from the Taste Feedback Loop. */
  signalsText: string;
  /** For persistence/debugging: what the retrieval layers surfaced. */
  meta: {
    libraryMatches: string[];
    memoryHits: number;
    librarySize: number;
    guidedWorld: string | null;
    dormant: boolean;
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
  const guided = findGuidedSessionByConversation(db, conversationId);
  const guidedText = guided
    ? clip(renderGuidedSessionContext(guided), BUDGET.guided)
    : "";

  const summary = getConversationSummary(db, conversationId);
  const summaryText = summary ? renderSummary(summary) : "";
  const signalsText = renderTasteSignals(db);

  return {
    profileText: clip(renderTasteProfile(profile), BUDGET.profile),
    libraryText: clip(renderLibraryMatches(matches), BUDGET.library),
    memoryText: clip(renderMemory(memory), BUDGET.memory),
    guidedText,
    summaryText,
    signalsText,
    meta: {
      libraryMatches: matches.map((m) => m.title),
      memoryHits: memory.length,
      librarySize: profile.librarySize,
      guidedWorld: guided?.slug ?? null,
      dormant: memory.length === 0 && profile.librarySize < 10,
    },
  };
}

export function renderContextBlock(ctx: ChatContext): string {
  const parts: string[] = [];
  if (ctx.summaryText) {
    parts.push(ctx.summaryText);
  }
  if (ctx.signalsText) {
    parts.push(ctx.signalsText);
  }
  if (ctx.meta.dormant) {
    parts.push(`## Context note\nThis is a dormant session — the user's profile is thin and there are no recent memory hits. Use the warmer welcome register.`);
  }
  parts.push(`## The user's taste profile (from their local library)\n${ctx.profileText}`);
  if (ctx.libraryText) {
    parts.push(
      `## Library entries relevant to this message\n${ctx.libraryText}`,
    );
  }
  if (ctx.memoryText) {
    parts.push(`## Relevant moments from earlier conversations\n${ctx.memoryText}`);
  }
  if (ctx.guidedText) {
    parts.push(`## Active Worlds guided tour (linked to this conversation)\n${ctx.guidedText}`);
  }
  return parts.join("\n\n");
}
