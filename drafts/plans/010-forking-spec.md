# 010 — Conversation Forking (Constellation Map)

- **Status**: DRAFT (state model only — visual UX pending @designer)
- **Owner**: @designer (spec) → @coder (implementation)

## Problem
A single conversation thread can't hold multiple simultaneous exploration paths.
When the user asks "compare Dune to Dune: Part Two", wants to branch into "also
show me similar sci-fi", and then pivots to "budget under $50M films" — all three
lines of inquiry share one history. Lumina loses the thread of earlier branches.

## State Model

```typescript
/* Forked off the existing conversation_summaries pattern (v7). */
interface Fork {
  id: number;              // PK
  parent_id: number;       // FK → conversations.id
  child_id: number;        // FK → conversations.id (the branched convo)
  label: string;           // user-assigned name or auto "Branch from [timestamp]"
  anchor_message_id: number;  // message that was forked FROM
  created_at: string;
}

/* conversations table: add fork_parent_id (nullable) */
ALTER TABLE conversations ADD COLUMN fork_parent_id INTEGER REFERENCES conversations(id);
ALTER TABLE conversations ADD COLUMN fork_label TEXT;
```

## Surface
- **Constellation map**: a new view off the conversation list. Shows each conversation
  as a node; forked children arranged as a radial tree around the parent. Clicking a node
  opens that conversation. Forking = drag a conversation onto another.
- **In-thread fork button**: "..." menu on any assistant message → "Fork from here".
  Creates a new conversation that starts with the context up to that message.

## Backend
- `POST /conversations/:id/fork` — body: { from_message_id, label }
  Creates new conversation + copies messages up to `from_message_id` + the summary
  (reuses `conversation_summaries` for context continuity).
- `GET /conversations/:id/forks` — returns child forks for the constellation map
- `GET /conversations/:id/constellation` — returns the full tree rooted at the top-level convo

## Nudge Integration
Forks that go dormant >7d without activity get a passive nudge on next open:
"Picking up where you left off: the sci-fi branch you started..." — same
in-session-only, context-note pattern as existing nudges. Respects `.impeccable.md`
reactive/hush identity.

## Open
- Visual layout: constellation vs. timeline? (@designer to specify)
- How summaries propagate across forks (merge or isolate?)
