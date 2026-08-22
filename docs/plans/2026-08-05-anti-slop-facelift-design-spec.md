# Anti-Slop Facelift — Full Design Spec

> **For agentic workers:** DESIGN ONLY until Daniel clears Gate D + Gate E. **No product code** until **Gate W** (Worlds merged) as well. Do not reopen locked decisions without an explicit reopen flag. Companion Wave 2 is vault-skin input, not a parallel product.

**Goal:** Ship Scope B full-app facelift — archive-backed projection booth, elevate-never-dull — as token-first then parallel surfaces, with Run 3 P0++/P1+ **absorbed** into the value inventory.

**Architecture:** Design Context in `.impeccable.md` (authority for principles). This spec is the implementable contract: tokens, type, surfaces, value tiers (incl. absorb), motion, copy, waves, collisions, success criteria.

**Tech Stack:** React 19 + Vite + Tailwind 4 client; Express server; tokens in `client/src/theme.css`; Framer Motion available (companion); fonts Fraunces / Public Sans / JetBrains Mono.

**Date:** 2026-08-05 · **G2 = absorb** decided same day · Gate A cleared.

**Related:**
- Resume: [`2026-08-05-anti-slop-facelift-resume-plan.md`](./2026-08-05-anti-slop-facelift-resume-plan.md)
- Ω3: [`2026-08-05-anti-slop-facelift-omega3.md`](./2026-08-05-anti-slop-facelift-omega3.md)
- Master: [`2026-08-05-unfinished-work-master-roadmap.md`](./2026-08-05-unfinished-work-master-roadmap.md)
- Transcript: `5e1fc460-9a7a-46c3-952c-7adc8bf908ef`

---

## 0. Absorb (G2) — what it means for this spec

**Decision:** G2 = **absorb** (2026-08-05). Facelift Gate A cleared.

**Absorb** = Run 3’s **P0++ (5)** and **P1+ (7)** are **in-scope** for design and eventual implementation. They are folded into the Ω2 surface/value map. They are **not** vetoed, **not** parked as “maybe later invent,” and **not** grounds to restart councils.

| Tier | Count | Role in this wave |
|------|-------|-------------------|
| P0 | 8 + presence/receipts | Must ship |
| P0+ | 6 | Enter facelift wave |
| **P0++** | **5** | **Absorbed — must design; ship with P0/P0+ rituals** |
| P1 | 8 | Same era, after P0+ stable |
| **P1+** | **7** | **Absorbed — design now; primarily W6 code** |

Run 3 **rejects** and **parked** lists stay rejected/parked (see §6).

---

## 1. North star (locked — do not drift)

Copy from `.impeccable.md` — if conflict, **`.impeccable.md` wins** and this spec must be amended.

### 1.1 Users & personality

- **User:** Daniel — builder-cinephile; local-first private archive + taste companion.
- **Jobs:** log/rate/track · decide tonight from *his* history · talk to something that knows his taste · never get spoiled.
- **Personality:** composed · knowing · hush. Boutique-cinema friend when summoned; private screening vault when browsing.

### 1.2 Aesthetic

- **Feel:** Archive-backed projection booth.
- **Refs:** Criterion hush · Apple TV+ poster polish · Aetherkeep observatory (gold-as-signal, grain, density).
- **Anti:** dark SaaS · Letterboxd social · AI chatbot lobby · purple haze · Inter · Sparkles/✦ · gold inflation · pill soup · precious museum boutique.
- **Theme:** Dark only. Ink theater, rare gold intermission light, film grain.
- **Type:** Fraunces (voice/titles) · Public Sans (UI/body) · JetBrains Mono (meta).

### 1.3 Principles (elevate-never-dull)

1. Elevate, never dull — cleaner-but-lesser → reject.
2. Gold = earned hierarchy, not austerity quota; FAB glow stays on live/active.
3. Every cut needs a richer replace.
4. Personal before popular — Tonight from taste.
5. Art heroic; chrome more material.
6. Fraunces speaks; Public Sans works.
7. Motion and presence add life — kill only meaningless motion.
8. Nothing sacred if the vault improves.

### 1.4 Global constraints

- Scope **B** — every surface.
- Token-first cascade, then parallel surface squads.
- Windows-first: **Ctrl+K**, **Ctrl+I**.
- No mascot. No chatbot lobby on `/`.
- No facelift code until Gates A–D clear **and** Gate W allows shared chrome edits.

---

## 2. Token system (W0 contract)

*Design targets for `client/src/theme.css` — implement only after Gate W.*

### 2.1 Keep / refine

| Family | Status |
|--------|--------|
| Ink ramp (`ink-950`…`ink-600`) | Keep; ensure warm-ink bias (no cold purple cast) |
| Mist text ramp | Keep; prefer tinted mist over pure gray-on-ink |
| Gold ramp (`gold-300`…`600`) | Keep; **earned use only** in components |
| Amber (over-used nudge) | Keep — distinct from gold |
| RT / TMDB critic hues | Keep — critics-only; **never** glow-lit; never restyle into gold |
| Grain `.grain` | Keep global; opacity ~0.05; under modals |
| Focus ring gold | Keep; refine radius consistency |
| Easings `--ease-out-expo`, `--ease-state` | Keep as booth/state pair |
| `color-scheme: dark` | Keep |

### 2.2 Replace (richer, not bare removal)

| Cut | Richer replace |
|-----|----------------|
| `--font-sans: Inter` | `--font-sans: "Public Sans", system-ui, sans-serif` (+ load Public Sans) |
| Purple body wash (`rgba(90, 90, 180, …)` radial) | Warm projection ambient — ink + soft gold dust only (or deep warm umber, never purple/cyan-AI) |
| Sparkles / ✦ in product chrome | Presence mark primitive (stateful, quiet) |
| Gold-on-every-hover | Lift / edge / vignette hover; gold on `:focus-visible` / active / live / earned verdict |
| Hollow companion welcome | Archive-aware dealt-in posters (≥3) |

### 2.3 Add (token names — illustrative; impl may alias)

| Concern | Intent |
|---------|--------|
| `--font-mono` | JetBrains Mono for meta |
| Panel lacquer | Translucency + soft top catchlight + hairline — material depth, not card-in-card |
| Presence intensities | Idle / thinking / tooling / writing / error as CSS vars or data-attrs |
| House Lights dim | Chrome luminance token for Title focus |
| Spoiler radius | Visual language for Blunt / Soft / Vault-locked (not poster blur) |

### 2.4 Consistency contract

- Tokens only — no one-off hex in components when a token exists.
- Shared panel / btn / focus / grain / easings.
- Presence replaces Sparkles everywhere in chrome.
- No purple. Dark only.
- Type roles never swapped (don’t put JetBrains on greetings; don’t put Fraunces on every button).

---

## 3. Typography

| Role | Family | Weight / tracking | Examples |
|------|--------|-------------------|----------|
| Voice / film titles / greetings / Closing Card / Program Note | Fraunces | Display: light–semibold; tight tracking on large | Tonight title, companion hello |
| UI / body / controls | Public Sans | Regular–medium; labels may use slight uppercase tracking | Nav, buttons, Settings |
| Meta / runtime / counts / debt | JetBrains Mono | Regular; rare | Vault count, episodes-left, timestamps |

**App scale:** Prefer rem steps (existing 2xs→lg) over fluid clamp for dense chrome; Discover Tonight title may use modest clamp for projection scale.

**Companion design note:** Older companion docs saying Inter are **superseded**.

---

## 4. Ω2 Surface map (consolidated + absorb)

### 4.1 Discover above-fold (one composition)

Full-bleed **Tonight from his taste** · Fraunces **Lumina** hero-level on the plane · one why-him line · CTA pair (Watch / Ask Lumina) · no trending-as-hero · no stats/pill soup · spectacle = *his* film at projection scale.

Optional under-hero: **Continue Tonight** ceremony arc (P0+).

### 4.2 Per surface — add / enrich / replace

| Surface | Add | Enrich | Replace slop → |
|---------|-----|--------|----------------|
| **Shell** | Ctrl+K omnibar; Jump List Pins (OS) | Lacquer rail; live gold FAB | Sparkles nav → presence mark |
| **Discover** | Tonight hero; Continue Tonight; Commitment Debt entry; DK Leaving-Soon on vaulted | Full-bleed + denser personal rails | Charts hero → personal continuum |
| **Library** | Density modes (shelf/dense/meta); Commitment Debt Board | Poster worship + mono meta | Card soup → edge-lift shelves |
| **Title** | Sticky mobile actions; Ask Lumina; complete-watching; **House Lights**; **First Frame**; **Closing Title Card**; **Standing Ovation**; **Darkroom Develop**; **Program Note**; Spoiler Radius | Backdrop stage; staged verdict gold | Pill clusters → decisive action stack |
| **Person** | Ask Lumina; taste-bridge; **Cast Chemistry Ledger** (W6 deep) | Criterion portrait lockup | Generic bio cards → archive shelf |
| **Companion** | Welcome dealt-in posters; in-app rename; Memory Marks; **Vault vs Self Verdict Clash** | *More* presence OK | ✦ lobby → presence + memory marks |
| **Settings** | Spoiler + sound/presence prefs; Focus Assist Handshake discoverability | Vault panels | SaaS form dump |
| **Shared** | Library-write receipts; presence states | Apple-TV PosterCard focus | Gold-every-hover → lift/edge + gold on active |
| **Worlds / Genre*** | — | Inherit tokens **post Gate W** | Do **not** half-skin mid-merge |

### 4.3 Value inventory (full stack)

#### P0 — must ship this wave

1. Tonight hero from taste  
2. Ctrl+K omnibar  
3. Companion welcome = dealt-in posters (≥3)  
4. Ask Lumina on Title/Person  
5. Sticky mobile Title actions  
6. Complete-watching ritual  
7. Library density modes  
8. In-app rename + spoiler discoverability  
(+ presence states, spoiler unveil craft, library-write receipts)

#### P0+ — deep pass, enter facelift wave

| Feature | One-line |
|---------|----------|
| **Intermission Mode** (Ctrl+I) | Chrome collapses to ink + one poster + one companion line |
| **Companion Memory Marks** | Gold mark when RAG cites *your* note/rating |
| **Continue Tonight ceremony** | Up Next → recap → mark watched as one arc |
| **Spoiler Radius Dial** | Blunt / Soft / Vault-locked |
| **Season Finale Seal** | Season-end ritual (≠ Closing Title Card) |
| **Fresh Framing** | Reframe suggestion craft without lobby chat |

#### P0++ — Run 3 absorbed (in-scope)

| Feature | Unlike prior because… | Primary wave |
|---------|----------------------|--------------|
| **House Lights** | Enter/exit Title focus dims chrome — opposite of Intermission | W3 |
| **First Frame** | Art holds the room a beat before chrome settles — not Tonight hero | W2/W3 |
| **Closing Title Card** | After log/rate: title · score · vault count — not Finale Seal / Curtain Call | W3 |
| **Commitment Debt Board** | In-progress series by episodes-left × runtime | W2 entry / W5 board |
| **DK Leaving-Soon** | Temporal scarcity on *already vaulted* DK services | W2/W5 |

#### P1 — same era, after P0+ stable

Verdict Queue · Local file/folder drop → TMDB match · Note→Companion bridge · Person Continuum / Director Gaps · Encore rewatch weather · Negative Space Shelf · Curtain Call · Reel Trace

#### P1+ — Run 3 absorbed (in-scope; mostly W6)

| Feature | Unlike prior because… |
|---------|----------------------|
| **Cast Chemistry Ledger** | Actor–actor dyads vs *your* ratings — not Director Gaps |
| **Vault vs Self Verdict Clash** | You vs Lumina’s model of you — not You vs Critics |
| **Darkroom Develop** | New save: silhouette → poster develop |
| **Standing Ovation** | Rare 9–10 hush beat — no confetti |
| **Focus Assist Handshake** | Mirrors Win11 Focus Assist live — not app Quiet Hours |
| **Jump List Pins** | Taskbar right-click Resume / last / shortlist — not tray |
| **Program Note** | Your note as one-shot cinema insert on revisit — not Note→Companion |

---

## 5. Motion & copy

**Authoritative detail:** [`2026-08-05-anti-slop-facelift-omega3.md`](./2026-08-05-anti-slop-facelift-omega3.md).

### 5.1 Motion summary

- Signature ease: booth (`0.22, 1, 0.36, 1`); state ease for presence/dim.
- Rituals must stay distinguishable: House Lights ≠ Intermission; Closing ≠ Finale ≠ Curtain; Standing Ovation = hush not celebration spam.
- `prefers-reduced-motion`: keep meaning, drop choreography.
- FAB glow retained on live/active.

### 5.2 Copy summary

- Fraunces speaks; Public Sans works; Mono for meta.
- Ctrl+K / Ctrl+I in all UI strings.
- Ban AI lobby speak and sparkle gamification.
- Spoilers honest; empty states teach next action.

---

## 6. Rejects, parked, vetoes

### 6.1 Run 3 rejects (secret twins — stay out)

| Rejected | Twin |
|----------|------|
| Cold Open | Continue Tonight |
| Spoiler-Safe Private Recap | Continue Tonight + Spoiler Dial |
| Lobby Card | Tonight hero |
| Focus Iris | Intermission / House Lights |
| Double Feature Bond | Double-Feature Binder (parked) |
| Reel Change | polish + Reel Trace name collision |

### 6.2 Run 3 parked (later — not this facelift wave)

Snapshot Time Machine · Binge Fracture Map · Craft Affinity · Near-Complete Orphan Sweep · Subscription Cover Score DK · Temporary Theme Mute · Double-Feature Binder · Matinee/Late Show · Shelf Whisper · Screening Card Print · Snap presets.

### 6.3 Standing veto list

Kill FAB glow · flatten panels to voids · mute presence · greyer `/` · gold austerity quota · spoilers blurring poster art · friends feed · public Wrapped · chatbot lobby on `/` · sparkle/streak gamification · light mode · rebound councils on locked feel/type/scope.

---

## 7. Implementation waves

| Wave | Focus | Notes |
|------|--------|-------|
| **W0 Tokens** | theme.css, fonts, purple kill, Inter→Public Sans, Sparkles→presence | Serial; blocks restyles |
| **W1 Shell** | Nav, Ctrl+K, FAB, presence mark | Jump List may stub |
| **W2 Discover** | Tonight, Continue Tonight, continuum rails | Debt + Leaving-Soon entry |
| **W3 Library / Title / Person** | Density, Ask Lumina, House Lights, First Frame, Closing Card, Darkroom, Ovation, Program Note | Sticky actions |
| **W4 Companion** | Welcome posters, Memory Marks, rename, clash presentation | Vault-skin / rewrite-if-needed |
| **W5 Rituals & boards** | Intermission, Finale Seal, Spoiler Dial, Debt Board, DK Leaving-Soon, Focus Assist | Settings |
| **W6 P1 / P1+** | Deepeners after stack stable | Chemistry, Clash full, Jump List, etc. |
| **W7 Sound handshake** | Cue kinds only | Gate S / Cuelume owns audio |

**Hard sequencing:** Gate W → facelift branch off post-Worlds `main` → W0 → parallel W1–W4 → W5 → W6 → W7.

---

## 8. Collisions

### 8.1 Gate W — Worlds

- Facelift **design** may proceed now (this document).
- Facelift **code** waits until Worlds is **merged** (preferred) or Daniel explicitly parks Worlds (Gate G1 = park).
- Do not edit `.worktrees/immersive-curated-genre-specific-experie`.
- Do not half-skin Genre*/CompareWorlds while Worlds is mid-merge.
- One track owns `theme.css` at a time — facelift owns tokens only on post-merge branch.

### 8.2 Sound (Gate S / G3)

- Reserve cue hooks for Closing Title Card, Standing Ovation, House Lights, Intermission.
- Do not invent a second sound system; silence default.
- Align Spoiler Dial with no spoiler-forward audio.

### 8.3 Companion / critics / labs

- Companion Wave 2 presence craft = input; type stack superseded.
- Critics RT/TMDB hues stay critics-only.
- Lumina’s Take bloom / recs ADR labs wait for facelift tokens where visual.

---

## 9. Gate status (honest — 2026-08-05 night)

| Gate | Question | Status |
|------|----------|--------|
| **A / G2** | Run 3 absorb / tweak / veto? | **CLEARED — absorb** |
| **B** | Consolidated Ω2 (surfaces + full value stack) yes? | **Draft locked by design lead — needs Daniel skim** |
| **C** | Ω3 motion · copy · waves yes? | **Draft written — needs Daniel skim** |
| **D** | This design spec approved? | **Written tonight — needs Daniel skim** |
| **E** | Subagent-driven vs inline execute? | **Open** (after D) |
| **W / G1** | Worlds merge before shared chrome code? | **Open — code blocked until merge/park** |
| **S / G3** | Sound absorb+extend vs postpone? | **Open** (W7 only) |

**Code rule:** No facelift implementation until **A+B+C+D** clear **and** **W** allows. Tonight’s work clears A and produces B/C/D artifacts for skim.

---

## 10. Success criteria

### Design-phase

- [x] Gate A answered (absorb)
- [ ] Gate B skim-approved
- [ ] Gate C skim-approved
- [ ] Gate D skim-approved (this file)
- [ ] `.impeccable.md` still matches principles (no drift)
- [ ] Gate W/S decided before code / W7

### Implementation (post Gates — tracked later in writing-plans impl plan)

- [ ] Purple body wash gone; Inter gone; Sparkles/✦ out of product chrome
- [ ] Fraunces / Public Sans / JetBrains live as specified
- [ ] Discover above-fold = Tonight-from-taste composition
- [ ] Every shipped P0/P0+/P0++ has richer replace for any cut
- [ ] Elevate test: more vault-like, never greyer-lesser
- [ ] Gold earned; FAB glow on live/active; panels keep material depth
- [ ] Absorbed P0++ rituals shipped with distinct motion/copy
- [ ] P1+ designed; W6 as prioritized
- [ ] Consistency contract held
- [ ] `typecheck` + `build` client clean; reduced-motion respected
- [ ] Worlds not half-skinned; Sound not double-owned

### Failure modes (reject on sight)

Quieter/greyer “anti-slop” · hard gold austerity · chatbot lobby on `/` · facelift PR fighting in-flight Worlds `theme.css` · confetti Standing Ovation · House Lights that is just Intermission renamed.

---

## 11. Next actions

1. **Daniel:** Skim Gates **B / C / D** (this package + Ω3). One reply can clear all three.
2. **Daniel:** Gate **W / G1** (Worlds ship-ready → merge vs park) before any facelift code.
3. **Agents:** After D + W → `writing-plans` implementation plan → Gate E → code (W0 first).
4. Commit `.impeccable.md` when implementation branch starts (currently untracked).

---

*Spec written 2026-08-05 · design only · G2 absorb · no code · no git.*
