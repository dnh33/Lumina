# Lumina Companion — Face-Lift Design (Wave 2)

*Supersedes `.claude/plans/quizzical-sparking-bear.md` (wave 1). This wave builds on the
existing "one turn anatomy" facelift and pushes presence, streaming polish, and craft harder.*

**Date:** 2026-07-12
**Scope:** The Companion surface only — `client/src/pages/ChatPage.tsx`, `client/src/components/chat/*`
(ChatDock, ChatThread, MessageBubble, SuggestionCards, SparkAvatar, ToolRibbon, etc.), `client/src/theme.css`,
and the streaming protocol in `client/src/lib/api.ts` + `server/src/llm/chatService.ts` (only where the
contract must grow for new UI states).

**Mode:** Redesign-preserve. Brand is strong (ink/gold, Fraunces + Inter, film grain). We *evolve* it.
The gold accent and the Fraunces serif are brand assets, so the generic design-taste bans on serif/AI-purple
do not apply here (explicit brand justification).

**Authoritative research (in repo root, generated this session):**
- `lumina-ui-design-principles.md` — 15 cinematic-design principles (depth-from-elevation, gold-as-rare-glow, one signature easing curve, restraint-over-spectacle, anti-slop chat checklist)
- `LUMINA_PRESENCE_PATTERNS.md` — 16 living-presence patterns (state-reactive metaphors, cinematic ambient, anti-slop)
- `streaming-llm-ui-best-practices.md` — 18 streaming/tool-viz/perf techniques (flicker-free markdown, reasoning viz, tool trace, graceful stop)
- `lumina-motion-recipes.md` — 16 Framer Motion recipes (enter/exit, state-reactive avatar, springs, stagger, micro-interactions, reduced-motion)

---

## 1. Current-state audit (what wave 1 shipped, what's still thin)

**Already solid (preserve, don't regress):**
- SSE streaming `context → delta → tool/tool_done → done/error`; optimistic user bubble; self-healing
  conversation; `AbortController` wired to server cancel (the Stop button already works).
- "One turn anatomy": a single `SparkAvatar` that breathes when composing; tool ribbon with spinner→check;
  receipt chips for library writes; spoiler veil; follow-up chips; poster suggestion cards.
- Real design tokens in `theme.css` (ink/gold ramp, Fraunces + Inter, grain, shimmer, `pulse-soft`).
  Global `prefers-reduced-motion` handling.

**Where it is still thin (this wave's surface):**
1. **The face is one state.** SparkAvatar breathes identically for idle/thinking/writing/tooling/error.
   No vocabulary of states. No personality beyond breathing. (Principles P1–P16.)
2. **Streaming still flickers.** Markdown is re-parsed per token via `react-markdown`; raw `**`/`##`/lists
   are visible mid-stream. No token buffering. Code blocks re-highlight whole-doc each frame. (Techniques T1–T6, T17.)
3. **No reasoning/transparency layer.** The model may emit `thinking`/tool reasoning; the UI shows none of it.
   Trust comes from showing *what kind* of work is happening. (T9, T10.)
4. **Tool-use is a flat chip ribbon.** Order/causality lost; no connecting trace; no in-flight "spark travel."
   (T11, T12.)
5. **Welcome/empty state is static.** No cinematic, context-aware greeting tied to the user's watch history;
   no re-engagement flow; no "rediscovery" loop. (Principles anti-slop #3; presence P15.)
6. **No motion choreography vocabulary.** Messages fade in; no staggered "dealing-in" of posters, no dock
   scroll-reactive compression, no spring system beyond enter/exit. (Recipes R1–R16.)
7. **Companion personality is text-only.** No user flows around voice/attention, no "what Lumina learned"
   moment, no proactive rediscovery nudge. (Presence P9, P13.)

---

## 2. Design principles (locked from research)

- **P-gold:** gold is rare and earned — ≤3 gold accents per screen; glow only on active/important state.
- **P-depth:** depth from translucency + soft shadow + faint top highlight, not borders. Grain = one global layer.
- **P-type:** Fraunces carries voice/titles/greeting; Inter carries body/metadata/controls. Tight tracking on
  Fraunces display, loose uppercase tracking on Inter labels.
- **P-motion:** one signature easing `cubic-bezier(0.22,1,0.36,1)`; entrances ≤400ms; stagger 60ms; motion
  reveals relationship or confirms action, never decoration.
- **P-presence:** premium presence = one honest restrained primitive + ambient light, not a mascot. Personality
  from copy/cadence/reaction, not a drawn face.
- **P-anti-slop:** no purple/blue blob, no generic robot avatar, no "✨ Ask me anything", no rainbow send button,
  no perpetual shimmer skeleton, no emoji decoration, no autoplay without intent.

---

## 3. User stories (priority order)

**Core (keep working, make delightful):**
- US-1 As a returning user, when Lumina is composing/streaming, I see a *distinct* living state (thinking ripples,
  writing comet) so I understand what kind of work is happening — not just "busy."
- US-2 As a reader, streamed markdown renders cleanly with zero flicker, so the answer feels composed, not assembled.
- US-3 As a user of tools, I see tool steps as an ordered *trace* with an in-flight spark, so I trust what Lumina did.
- US-4 As an interrupted user, Stop freezes the partial answer cleanly and lets me edit/resume, with no error blast.

**Craft (the facelift):**
- US-5 As a first-time/dormant user, I get a cinematic, context-aware welcome (greeting in Fraunces + suggestion
  posters "dealt in"), so the Companion feels alive before I type.
- US-6 As a scroller, the dock/panel responds to scroll with subtle compression, so the surface feels physical.
- US-7 As a motion-sensitive user, every animation degrades to a still/opacity-only state and the UI stays usable.

**Outside-the-box (think bigger):**
- US-8 As a cinephile, Lumina can *surface* a reason ("I remembered you love slow-burn thrillers") when it suggests
  something — a "memory constellation" moment extending the star motif.
- US-9 As a power user, I can *peek* at Lumina's reasoning/tooling as a collapsible interstitial, so I learn how it thinks.
- US-10 As a voice user (future), the core leans toward my input and pulses to audio — attention made visible.

---

## 4. User flows

**F1 — A normal turn (delightful):**
idle spark (breathing) → user sends (send↔stop cross-rotate swap) → `context` event (subtle "reaching into
library" whisper) → spark enters *thinking* (ripples) → `tool` (trace node lights, spark travels) → `tool_done`
(receipt chip pops in) → `delta` (writing comet + flicker-free markdown) → `done` (spark settles to idle, follow-up
chips deal in) → user scrolls, dock compresses.

**F2 — Interruption:**
user hits Stop → `abortSignal` cancels server LLM → partial text freezes, footer "· stopped" → send button restored
→ user edits prompt → resume continues from edited prompt (no lost work).

**F3 — Cold start / rediscovery:**
land on Companion → cinematic welcome (Fraunces greeting + 3–4 context-aware suggestion posters dealt in with
rotateX) → user picks one → F1. If dormant >N days, one "memory constellation" line ("I kept your slow-burn list
warm") before suggestions.

**F4 — Transparency peek (US-9):**
during a tool-heavy turn, a subtle "Lumina is working" interstitial shows the step currently executing; on completion
a collapsible "How I got there" reveals the ordered trace + reasoning summary (default collapsed, peekable).

---

## 5. Feature matrix

### A. Presence system (the new "face") — replaces single-spring SparkAvatar
| Feature | Source | Notes |
|---|---|---|
| State machine: idle/thinking/tooling/writing/error | presence P2,P14 | One primitive, 5 visual states |
| Breathing core (idle) | P1, R5 | scale loop 3.2s, transform-only |
| Thought ripples (thinking) | P2 | 2–3 concentric SVG rings, staggered |
| Writing comet (streaming) | P3,R7 | gold trail riding caret via MotionValue |
| Tooling orbit + beads | P4,P5 | satellite dot + per-step bead light |
| Error fault-line | P14 | desaturate + red-gold hairline, no shake |
| State whisper label (Fraunces) | P15 | "considering…" calm copy |
| Reduced-motion portrait | P16,R16 | still, beautifully rendered core |
| Memory constellation (US-8) | P13 | gold stars appear on "learned" events |

### B. Streaming polish
| Feature | Source | Notes |
|---|---|---|
| Streaming-safe markdown (no flicker) | T1,T2,T3 | swap react-markdown → Streamdown/assistant-ui MarkdownTextPrimitive |
| Token buffering (smoothStream) | T6 | flush ~16–50ms, not per-token |
| `useDeferredValue` parse decoupling | T2,T17 | keep typing/scroll unblocked |
| Code highlight via Shiki transformers | T5 | stable tokens, no whole-doc re-highlight |
| Word-reveal + reduced-motion auto-off | T7,T8 | word granularity; `smooth` disabled under reduce |
| `content-visibility:auto` off-screen msgs | T17 | perf for long transcripts |

### C. Tool-use visualization
| Feature | Source | Notes |
|---|---|---|
| Tool trace rail (connecting line + nodes) | T11 | replaces flat ribbon; causality visible |
| Spark travel along rail | T12 | in-flight motion, reduce-aware |
| Tool summary chip (not raw JSON) | T13 | uses existing `tool_done.summary`; fixed min-height |
| Receipt pop | R14 | springy confirm for library writes |

### D. Reasoning/transparency
| Feature | Source | Notes |
|---|---|---|
| Collapsible thinking block | T9 | default collapsed-but-peekable |
| Interstitial "working" anchor | T10 | pinned task + streaming steps (F4) |
| Graceful stop + resume | T14,T15 | wire to existing AbortController + edit-resume |

### E. Welcome / empty / re-engagement
| Feature | Source | Notes |
|---|---|---|
| Cinematic welcome (Fraunces + posters) | P6,P15,R11 | dealt-in rotateX stagger |
| Context-aware suggestions | principles anti-slop #3 | tied to watch history |
| Memory constellation nudge | P13 | dormant-user rediscovery (US-8) |
| Dock scroll-compression | R15 | scroll→scale via useScroll/useTransform |

### F. Motion system (global)
| Feature | Source | Notes |
|---|---|---|
| Signature easing token | P13 | `cubic-bezier(0.22,1,0.36,1)` everywhere |
| Message enter/exit spring | R1,R2 | 18px y + opacity |
| Send↔Stop cross-rotate | R13 | AnimatePresence mode=wait |
| Stagger container 60ms | R4 | messages, ribbon, posters |
| Spring button/card | R9,R10 | 400/17, 300/25 |
| MotionConfig reducedMotion="user" | R16 | global wrapper |

---

## 6. Success criteria (testable)

1. **Zero markdown flicker** — streaming a message containing `**bold**`, `## heading`, a fenced code block, and a
   table shows no layout jump / no raw-syntax flash. (Visual + DOM-assert test.)
2. **Distinct states** — idle/thinking/tooling/writing/error each render a visibly different SparkAvatar state;
   error state shows no shake and no symmetric fast spinner.
3. **Perf** — during a 60-message transcript with continuous streaming, scrolling + typing stays ≥55fps
   (Chrome devtools perf trace / `requestAnimationFrame` delta sampling); no layout thrash on token arrival
   (all motion transform/opacity/filter only).
4. **Tool trace** — a tool-using turn renders an ordered trace with a connecting line, per-step beads, and an
   in-flight spark; the `tool_done` summary (not raw args) is shown; chip height never shifts on spinner→summary swap.
5. **Graceful stop** — Stop freezes partial text, shows "· stopped", restores send; editing the prompt + resend
   continues without duplicating the frozen message or throwing.
6. **Reduced motion** — with `prefers-reduced-motion: reduce`, all ambient loops stop, spark shows static state,
   markdown reveals instantly; UI fully usable. (Toggle test.)
7. **Welcome** — cold start shows cinematic greeting + ≥3 dealt-in suggestion posters; selecting one starts F1.
8. **Brand fidelity** — gold accents ≤3 per screen; Fraunces only for voice/titles/greeting; no purple/blue, no
   robot avatar, no emoji decoration. (Design-review gate.)

---

## 7. Open decisions (resolve at design gate)

- **D1 — Reasoning visibility scope.** Full collapsible thinking block (T9) requires the model to emit `thinking`
  events. Lumina's current system prompt + OpenRouter call may not stream reasoning. Options: (a) client-side
  *simulated* "working" interstitial driven by tool/streaming state only (no model reasoning needed), or
  (b) extend `chatService.ts` to request + stream reasoning from the model. **Recommend (a) for wave 2** (ships
  without backend risk), with (b) as a follow-up.
- **D2 — Presence primitive form.** Keep the spark/star motif (brand continuity, P13 Memory Constellation) vs.
  introduce a new orb/face. **Recommend: evolve the star into a "star-core"** — same 4-point mark, now with
  state vocabulary, ripples, and orbit. No mascot.
- **D3 — Markdown engine swap risk.** Streamdown vs assistant-ui `MarkdownTextPrimitive`. Both drop-in.
  **Recommend Streamdown** (Vercel, smallest surface, Shiki built in) unless Lumina's custom `components` for
  `.prose-lumina` are hard to port — plan task will spike this first.
- **D4 — Voice/attention (US-10).** Out of scope for wave 2 implementation (no voice input yet); include the
  *lean* affordance hook (P9) as a no-op wired to focus, defer audio-reactive to when voice lands.

---

## 8. Anti-scoping (explicitly NOT doing)

- No new backend data models, no new tools, no RAG changes (server only touched if D1=b).
- No light/dark theme toggle (app is intentionally dark; principle P-depth assumes dark).
- No mobile-native shell; responsive web only.
- No persona/character customization (Replika trap — tacky when over-customized).
- No sound, no haptics, no autoplay (dark-room viewing respect).
