# Anti-Slop Facelift — Ω3 (Motion · Copy · Waves)

> **Status:** Design lead draft · **2026-08-05** · Gate C = needs Daniel skim (not a new council — Run 3 already absorbed).  
> **Authority:** Locked feel/type/elevate from `.impeccable.md` + resume plan. **G2 = absorb** — P0++/P1+ are in-scope; do not re-invent or veto here.  
> **Code:** Forbidden until Gates A–D + **Gate W** (Worlds merged). This doc is design contract only.

**Goal:** Lock motion vocabulary, UX writing, and implementation wave order so the full design spec can ship without reopening Scope B / booth / fonts / elevate-never-dull / token-first.

**Council seats (structured, not restarted):** UX Strategist · Frontend Lead · Product/Interaction — same hard constraints as prior waves; verdict for this draft = **APPROVE** pending Daniel Gate C skim.

---

## 0. Absorb note (why P0++/P1+ appear here)

**G2 = absorb** (decided 2026-08-05) means Run 3’s P0++ and P1+ are **in the design**, not optional garnish and not a second invention pass. Ω3 therefore:

- Names motion recipes for House Lights, First Frame, Closing Title Card, Standing Ovation, Darkroom Develop, etc.
- Assigns waves that include Commitment Debt, DK Leaving-Soon, Chemistry Ledger, Jump List Pins, …
- Does **not** re-cut the reject/park lists from Run 3.

---

## 1. Motion vocabulary

### 1.1 Signature system

| Token / name | Value | Use |
|--------------|-------|-----|
| **Ease booth** | `cubic-bezier(0.22, 1, 0.36, 1)` (= existing `--ease-out-expo`) | Entrances, deal-in, First Frame settle, Closing Title Card |
| **Ease state** | `cubic-bezier(0.4, 0, 0.2, 1)` (= `--ease-state`) | Presence state crossfades, spoiler unveil, House Lights dim |
| **Stagger** | 60–80ms | Poster deal-in, rail items, Memory Marks reveal |
| **Entrance budget** | ≤400ms typical; First Frame hold ≤600ms art-only beat | Never bounce / elastic |
| **Properties** | `transform` + `opacity` (+ color for gold earned) | No layout anim (width/height/top/left) |
| **Reduced motion** | Instant opacity / no hold beats / no dim choreography | Keep state *meaning* (labels, marks) |

**Kill on sight:** meaningless card lift on every hover; perpetual shimmer skeletons; confetti; Sparkles orbit; bounce; `transition: all`.

**Elevate replaces:** gold-every-hover → edge-lift + vignette; gold reserved for focus / active / live / earned verdict.

### 1.2 Named rituals (must feel distinct)

| Ritual | Trigger | Beat (full motion) | Reduced-motion | Unlike |
|--------|---------|--------------------|----------------|--------|
| **Deal-in** | Companion welcome; rail settle; Memory Marks | Staggered opacity+Y (14px→0), 60ms step, booth ease | Instant show | Generic fade-in list |
| **First Frame** | Title / Discover hero mount | Art owns frame ~400–600ms; chrome fades in after | Art + chrome together | Tonight hero composition (content), not timing twin |
| **House Lights** | Enter/exit Title focus (deep read) | Chrome opacity/luminance down; poster stage up; reverse on exit | Instant dim class, no tween | **Intermission** = mid-session pause (Ctrl+I), not focus enter |
| **Intermission** | Ctrl+I | Collapse to ink + one poster + one companion line; restore on exit | Swap layouts, no animate | House Lights |
| **Closing Title Card** | After log/rate success | Brief end-card: title · your score · vault count; then dismiss | Static toast-equivalent card | Finale Seal (season end); Curtain Call (session end) |
| **Standing Ovation** | Rare 9–10 rate | Hush beat: gold pulse once + presence settle — **no confetti** | Single opacity flash max | Closing Title Card (always after log) |
| **Darkroom Develop** | New save / poster first appear | Silhouette → poster develop (opacity + slight unblur ≤8px) | Instant poster | First Frame (route enter) |
| **Continue Tonight** | Under Tonight hero | Arc: Up Next → recap → mark watched as one continuous stage | Step labels without motion | Cold Open (rejected twin) |
| **Spoiler unveil** | Spoiler Radius / veil lift | Soft reveal (opacity + optional clip), never blur *poster art* | Instant show text | — |
| **FAB live** | Companion live/active | Retain glow; refine pulse Soft — do **not** kill | Static gold ring | Decorative idle glow soup |
| **Library write receipt** | Save/rate/status | Chip deal-in + brief gold edge | Instant chip | — |
| **Program Note insert** | Revisit title with your note | One-shot cinema insert (Fraunces line over art beat) | Static note banner | Note→Companion bridge |

### 1.3 Presence motion (Companion)

Keep / intensify state vocabulary (idle · thinking · tooling · writing · error). Presence = honest primitive + ambient light — not mascot, not ✦.

Crossfade states with **ease-state** ≤250ms. Tool trace spark travel stays; kill decorative orbit.

### 1.4 Keyboard / high-frequency

**Do not animate** Ctrl+K open content for every keystroke inside results; panel enter once (≤200ms). Arrow navigation = no motion. House Lights / Intermission are intentional rituals — allowed.

---

## 2. Copy / UX writing

### 2.1 Voice split

| Layer | Voice | Type |
|-------|-------|------|
| Companion prompts / greetings / Program Note / Closing Title Card lines | Eloquent · warm · precise | **Fraunces** |
| Chrome · buttons · Settings · density labels · omnibar | Quiet · material · short | **Public Sans** |
| Meta · runtime · vault counts · debt numbers | Sparse · factual | **JetBrains Mono** |

### 2.2 Principles

1. **Every word earns its place** — no restating the heading in a subtitle.
2. **Hush on `/`** = placement (not chatbot lobby), not mute copy.
3. **No AI lobby copy:** ban “✨ Ask me anything”, “How can I help?”, sparkle/streak gamification language.
4. **Windows-first shortcuts in UI:** **Ctrl+K**, **Ctrl+I** — never ⌘.
5. **Spoilers:** honest radius labels — Blunt / Soft / Vault-locked — not cute euphemisms that hide trust.
6. **Gold moments get quiet words** — Standing Ovation is hush, not “Achievement unlocked”.
7. **Personal before popular** — Tonight why-line is *why for him*, not trending boilerplate.

### 2.3 Label contracts (examples — implementers match tone)

| Surface | Do | Don’t |
|---------|-----|-------|
| Omnibar | “Search vault & titles” / placeholder “Jump to…” | “Ask AI…” |
| Intermission | “Intermission” · “Resume booth” | “Focus mode ✨” |
| House Lights | No toast spam — visual only; optional aria “Title focus” | “Immersive mode activated!!!” |
| Closing Title Card | Title · “Your score” · “n in vault” | “Logged! 🔥” |
| Commitment Debt | “Attention owed” / “Episodes left” | “Streak at risk” |
| DK Leaving-Soon | “Leaving [service] · [date]” on vaulted only | Fake urgency on unowned titles |
| Standing Ovation | Silence or one Fraunces line | Confetti copy |
| Ask Lumina | “Ask Lumina” | “Chat with AI” |
| Companion rename | In-app name field; respectful | Mascot nicknames as default |
| Settings sound | “Interface sounds” · default off language | “Soundscape experience” |
| Jump List (OS) | Resume / Last title / Shortlist | Marketing blurb in jump list |

### 2.4 Empty & error

Empty states teach the next action (add title, open Ctrl+K, start Companion) — never “Nothing here” alone. Errors: precise, non-blaming, no emoji decoration.

---

## 3. Implementation waves (locked shape)

**W0 before any surface restyle** remains locked (token-first). Ω3 may refine W2–W6 order; below is the **recommended** order after absorb.

| Wave | Focus | Surfaces / systems | Absorbed features owned here |
|------|--------|-------------------|------------------------------|
| **W0 Tokens** | `theme.css`, fonts, gold/earned light, grain, panel language, focus rings; kill purple body wash + Inter + Sparkles/✦ in product chrome | Global | Type stack; ease tokens; presence primitive tokens |
| **W1 Shell** | Nav hairline, Ctrl+K shell, FAB rewrite (glow kept live), presence mark | `Shell.tsx`, omnibar | Jump List Pins *(OS bridge; may stub labels in W1, wire in W6 if Electron/PWA limits)* |
| **W2 Discover** | Tonight hero composition, Continue Tonight, rails = personal continuum | `Discover.tsx` | DK Leaving-Soon rail/chip on vaulted; Commitment Debt entry point |
| **W3 Library / Title / Person** | Density modes, sticky actions, Ask Lumina, First Frame, House Lights, Closing Title Card | `Library`, `TitleDetail`, `PersonPage` | Darkroom Develop; Standing Ovation; Program Note; Cast Chemistry / Director Gaps hooks |
| **W4 Companion vault-skin** | Welcome posters, Memory Marks, presence intensity, rename | `ChatPage` + `components/chat/*` | Vault vs Self Verdict Clash presentation; Note→Companion |
| **W5 Rituals & boards** | Intermission, Finale Seal, Spoiler Dial, Commitment Debt Board, DK Leaving-Soon full | Cross-cutting + Settings | Focus Assist Handshake; Spoiler Radius Dial |
| **W6 P1 / P1+ deepeners** | After P0/P0+/P0++ stack stable | As prioritized | Chemistry Ledger full · Verdict Clash full · Jump List complete · Encore · Negative Space · Curtain Call · Reel Trace · Verdict Queue · File drop |
| **W7 Sound handshake** | Cue map only — no second sound system | Settings stub + ritual hooks | Closing Title Card / Ovation / House Lights cue *kinds* reserved for Cuelume (Gate S) |

### 3.1 Wave rules

1. **No facelift code until Gate W** — Worlds merged (or explicit park). Do not restyle Genre*/CompareWorlds mid-merge; do not edit Worlds worktree.
2. Parallel surface squads **only after W0** lands on the facelift branch.
3. Elevate test per wave: vault feels *more* material/cinematic — never greyer-lesser.
4. Every slop cut ships with its richer replace in the same wave (or immediately prior token wave).

### 3.2 Proposed parallel after W0 (file-disjoint)

```
W0 (serial)
  └─► W1 Shell ─────────────────────────────┐
  └─► W2 Discover  (∥ W1 if files disjoint)  │
  └─► W3 Lib/Title (∥ after W1 omnibar OK)  ├─► W5 Rituals
  └─► W4 Companion (∥)                      │
                                            └─► W6 deepeners → W7 sound hooks
```

---

## 4. Gate C checklist (Daniel skim)

- [ ] Motion table: rituals feel distinct (esp. House Lights ≠ Intermission; Closing ≠ Finale ≠ Curtain)
- [ ] Copy: Ctrl+K/I, no lobby AI speak, spoiler honesty
- [ ] Wave order: W0 first; absorbed P0++ in W2–W5; P1+ mostly W6
- [ ] Gate W respected: no code against mid-merge Worlds chrome
- [ ] Sound: hooks only until Gate S

**On skim yes → Gate D** (full design spec). Spec file: `docs/plans/2026-08-05-anti-slop-facelift-design-spec.md`.

---

## 5. Non-goals (Ω3)

- New invention run / council restart
- Sound sample design (Cuelume owns)
- Worlds genre page visual system (post-merge inherit tokens)
- Light mode
- Public social / Wrapped / friends feed

---

*Ω3 drafted 2026-08-05 · design only · G2 absorb folded in.*
