# /genre/:slug — The FEEL: Emotional Arc & Sensory/Aesthetic Layer per Genre

> **⚠ CORRECTION (2026-07-15):** This companion doc was written against the unverified Phase-1 font/accent assumption. The **real** app tokens (verified in `client/src/theme.css`) are:
> - Accent: **`gold-400 #e8b84b`** (active/rating) + **`amber-400 #fbbf24`** (passive "over-used" nudge) — NOT "Projector Amber #E0A868".
> - Fonts: **`--font-display: "Fraunces", serif`** + **`--font-sans: "Inter", sans-serif`** (theme.css:32-33) — NOT Cabinet Grotesk/Geist/Geist Mono.
> Where this doc says "Cabinet Grotesk/Geist/Geist Mono" or "Projector Amber", read it as the real Fraunces/Inter + gold/amber stack (decide in build whether to migrate). The *per-genre modulation concept* (register variation, not new families) still holds. The master doc `2026-07-15-immersive-genre-experience-design.md` §13.1 is the corrected source of truth.

**Strand:** EMOTIONAL-EXPERIENCE DESIGN (the "feel" beyond recoloring)
**Status:** Synthesis only. NOT a build. Grounded in the locked design system + real `lib/sound.ts` cues + the single `luminaSystemPrompt`.
**Companion to:** `2026-07-15-immersive-genre-experience-design.md` (the architecture/IA plan) and `lumina-genre-deepdive-contextual-elements.md` (the element inventory).

---

## 0. The thesis (why recolor is not enough)

A genre deep-dive fails if it only swaps a tint. The user *enters a world*, and a world is felt through five channels at once: **space** (what is this place), **motion** (how does it move), **type** (how does it speak), **sound** (what moments are marked), and **voice** (who walks you through it). The tint is the wallpaper; the feel is the architecture, the weather, and the guide.

This doc specifies, per genre, the emotional arc (entry → immersion → guided → closure) and the sensory layer across all five channels. The type and motion channels are **parametric variations on the locked system** (Cabinet Grotesk / Geist / Geist Mono; `EASE_OUT_EXPO` + `stagger60` + `posterDeal`), not new fonts or new easings. Sound uses **only the 10 existing Cuelume cues** in `lib/sound.ts`; the per-genre layer is *which beats fire which cue*, never new audio. The Companion is **the same single agent** wearing a genre register, not a second LLM.

**The richness test (user steer):** a deep-dive is "rich enough" when, on exit, the user feels they were *walked through a place by a guide who knows their taste*, not that they *used three features*. The combine rule in §4 is what earns that.

---

## 1. Locked constraints this design obeys (non-negotiable)

- **One accent.** Projector Amber `#E0A868`. Gold reserved for the single active caret/now-playing. Genre atmosphere = a **capped duotone on hero/ambient layers only**; chrome, text, and contrast never shift.
- **Dark-locked.** Near-black spine (`--surface #0B0D10`, `--text-primary #ECEEF1`). No light toggle.
- **Type system fixed.** Cabinet Grotesk (display) + Geist (body) + Geist Mono (data/metadata). No Inter. No serif default. Per-genre "type voice" = parameter variation, not new family.
- **Em-dash BANNED** in all copy and this doc. Sentence/colon/`·` only.
- **Motion = transform/opacity only.** Reuses `EASE_OUT_EXPO`, `EASE_STATE`, `stagger60`, `posterDeal`. Per-genre motion = duration/stiffness/stagger modulation + choreography vocabulary inside that family.
- **Reduced-motion = silence + stillness.** `prefers-reduced-motion` disables every loop/parallax AND mutes all sound (enforced in `lib/sound.ts`). The arc must still be *felt* via opacity/state/copy alone.
- **Sound = opt-in, cue-only, no autoplay, no ambient loops.** Fixed 10 cues: `chime sparkle droplet bloom whisper tick press release toggle success`. Per-genre sound = beat mapping.
- **One Companion.** `luminaSystemPrompt` + `buildChatContext` reused verbatim. Genre shift = a register block appended in `genreCuratorPrompt`, not a new system prompt, not a new agent, not a new model call.
- **Perf budgets.** LCP<2.5s, INP<200ms, CLS<0.1. Route-split, reserved space, `content-visibility:auto`.
- **A11y floors.** 4.5:1 contrast (axe), 44×44px targets, keyboard + visible focus rings, heading hierarchy, color-not-only.

---

## 2. The six worlds

Each world below gives: the **spatial metaphor**, the **motion character**, the **type register**, the **sound beat-map**, the **Companion register** (lexicon/tempo/question, layered on the one voice), and the **emotional arc** (entry → immersion → guided → closure) in concrete, sensory terms.

---

### 2.1 SCI-FI — "The Constellation"

**Spatial metaphor.** A star-chart / orbital readout. Posters are points of light on a near-black field; the user's rated titles glow a warmer amber node. The Memory Constellation motif (gold stars) is the native grammar here. Hero = the genre resolving from noise into a map of points.

**Motion character (precise / glacial).** Long `EASE_OUT_EXPO` holds (700–1000ms vs the 400ms default), wide, even stagger gaps (120–160ms) so cards "arrive in formation," grid-snapped, no bounce. Signature gesture: a slow pointer-driven drift of the star-field behind the hero (compositor-only transform). Reduced-motion → static field, points simply fade in.

**Type register.** Cabinet Grotesk display at near-zero tracking, heavy optical weight, mission-control poise. Eyebrows in Geist Mono ALL-CAPS as readouts (`SECTOR: HARD SCI-FI` · `DISTANCE: 1968–NOW`). Body Geist at a calm, wide measure. All numbers/labels in Geist Mono tabular. The genre *reads* like a console.

**Sound beat-map (cool, distant).** `sparkle` = the "new signal" beat (the mood-match handoff is Sci-Fi's natural home). `bloom` = companion wake ("coming online"). `tick` = selecting a node/era. `chime` = arc completion. **Withheld:** `success` celebration is dialed down (a save is logged, not cheered). No ambient. The discipline: sound stays cold so wonder comes from the image, not the chime.

**Companion register: "The Navigator."** Appended block, same agent. Lexicon: systems, signals, scales, first contact, vectors, orbit. Tempo: measured, declarative, one clause per thought. Opening question: "What orbit do you want to map?" Frames recs as coordinates tied to their taste ("you rated **Arrival** 10, this shares its patience"). Still warm, specific, spoiler-safe.

**Emotional arc.**
- *Entry:* a held breath. The teal duotone wipe, the field resolves from static to points of light. You feel small and curious, like a telescope powering on. Quiet.
- *Immersion:* you glance across the constellation; your own titles glow warmer. The Era/Timeline scrubber lets you sweep decades of the genre like scanning a long exposure. Cool wonder, a sense of scale.
- *Guided:* the Navigator wakes (`bloom`) and walks an arc: "from the rigid optimism of 60s speculation to the bone-cold questions of now." Each title is a coordinate. You feel oriented, not lost.
- *Closure:* the arc closes (`chime`); a coda card offers the next constellation branch. You leave with a *map*, not a list. The satisfaction of having charted something.

---

### 2.2 HORROR — "The Threshold"

**Spatial metaphor.** A dark house / the threshold you cross. Confined, vignette-tight, edges eaten by dark. Posters are doors. Hero = the world narrows inward; the frame closes around you rather than opening out.

**Motion character (visceral / erratic, but controlled).** Tighter durations (220–320ms), uneven stagger (mostly 40ms, with one deliberate 0-gap "jolt" reveal), slight scale-punches on hover (transform-only). Signature: a single, rare, opacity-only *flicker* as a card enters (a flicker, never a shake). Reduced-motion → smooth single fade, no flicker, no jolt.

**Type register.** Cabinet Grotesk display at loose, uneasy tracking, lighter weight, as if whispered. Eyebrows in Geist Mono lowercase, dimmed, like a label on a door. Body Geist tight, short lines: a claustrophobic measure. The genre *reads* like a held breath.

**Sound beat-map (near-silence = dread).** **Withheld:** `sparkle` and `chime` (no delight, no soft close). `tick`/`toggle` used sparingly for tension (a toggle = a door closing). `bloom` on companion wake is repurposed as "something is in the room." `success` withheld (saving a horror title is not celebrated). The discipline: almost no sound is the loudest choice.

**Companion register: "The Lamplighter."** Lexicon: dark, door, room, underneath, what waits, the silence, the edge. Tempo: slow, with pauses between sentences. Opening question: "How close to the edge do you want to stand?" Frames recs as warnings and invitations ("I wouldn't start you here" / "this one earns its scare"). Same voice, lower light.

**Emotional arc.**
- *Entry:* a held breath that doesn't release. The oxblood-black duotone wipe, the world narrows. You feel the room get smaller. A little afraid, willingly.
- *Immersion:* you hover a poster; it flickers. The Topic/Theme Cluster Graph reads like a map of fears (sub-themes). You feel your own pulse, amused by your nervousness.
- *Guided:* the Lamplighter wakes (`bloom`) and doesn't rush: "We'll keep the lights low." Walks you from a slow-burn to a raw nerve. You feel *accompanied through the dark*, safer for it.
- *Closure:* no fanfare. A quiet coda: "You can leave the light on." You return to the Shell feeling you survived something, pleased.

---

### 2.3 DOCUMENTARY — "The Reading Room"

**Spatial metaphor.** An archive / evidence wall / reading room. Orderly, paper-and-light. Posters are files. Hero = a folder opening; the world is tidy and trustworthy.

**Motion character (measured / earnest).** Even cadence (the `stagger60` baseline, 60ms), no flourish, no bounce. The Timeline scrubber and Topic Cluster Graph feel like turning pages / pinning notes: steady, legible. Reduced-motion parity is nearly free here (already calm); the arc is preserved by copy.

**Type register.** Cabinet Grotesk display with honest, moderate tracking, almost editorial. Eyebrows in Geist Mono as catalog/source metadata (`SRC: 3 CRITIC / 1.2K CROWD` · `POV: SKEWED`). Body Geist at a generous, readable measure (this world is for reading). Credibility tier shown as typographic metadata, not color.

**Sound beat-map (quiet, purposeful, like a library).** `chime` = soft close of a section. `tick` = selecting a source/era. `success` = saving to library reads as "filed." The "Grounded in" ribbon earns a `tick` per source. Deliberately the most *documentary* sound profile: quiet, final, never decorative.

**Companion register: "The Archivist."** Lexicon: evidence, perspective, whose lens, what it leaves out, the record, the counter-argument. Tempo: clear, plainspoken, cites. Opening question: "Whose account do you trust here?" Frames recs with POV/bias notes (the credibility layer). Same voice, more citation.

**Emotional arc.**
- *Entry:* a settling. The cool-steel duotone wipe, the folder opens. You feel your shoulders drop. This is a place to think.
- *Immersion:* the Cluster Graph shows the shape of a subject you thought you knew; the credibility layer shows where sources diverge. You feel informed, a little smarter.
- *Guided:* the Archivist wakes and walks you through "watch this first, then this dissenting view." You feel *shown*, not sold. Trust.
- *Closure:* a coda that hands you the thread to pull next ("the counter-argument lives in X"). You leave with a *question*, not just titles. Engaged, not sated.

---

### 2.4 ROMANCE — "The Warm Interior"

**Spatial metaphor.** A warm room / correspondence / a dance. Soft light pooling. Posters are letters or photographs on a mantel. Hero = the room brightens; the frame warms.

**Motion character (tender / breathing).** Medium durations (500–700ms), gentle stagger (80ms), a soft scale-breathe on the hero. Signature: cards *settle* rather than *deal* (lighter `y`, no `rotateX` tilt; upright, like framed photos). Hover = a small, warm lift. Reduced-motion → settles become plain fades.

**Type register.** Cabinet Grotesk display at its softest optical setting, generous tracking, lowercase-friendly. Eyebrows in Geist Mono as quiet timestamps (`A SLOW BURN` · `ENDS WELL`). Body Geist warm, conversational measure. The genre *reads* like a letter.

**Sound beat-map (the warmest profile).** `chime` = the soft close, the "aww." `sparkle` reserved for the mood-match handoff (delight belongs here). `success` on save = filing a love. `bloom` on companion wake = "hello, I'm here with you." 

**Companion register: "The Confidant."** Lexicon: heart, want, risk, the timing, what they're afraid of, the nearly. Tempo: warm, unhurried, asks one gentle question. Opening question: "What kind of ache are you in the mood for?" Frames recs as "this one breaks hearts the way you like." Same voice, nearer.

**Emotional arc.**
- *Entry:* a warmth. The amber duotone wipe, the room brightens. You feel a little hopeful, a little soft.
- *Immersion:* posters are faces; the romance rails ("slow burns," "the ones that end well") read like knowing a friend's type. You feel *seen* in your longing.
- *Guided:* the Confidant wakes (`bloom`, "hello") and reads you gently: "you like the ones where they almost don't make it." You feel understood, maybe a little exposed, pleasantly.
- *Closure:* `chime`, a coda like a closing letter. You leave feeling warm, with one you'll watch tonight.

---

### 2.5 WESTERN — "The Frontier"

**Spatial metaphor.** The frontier / horizon / a weathered notice board. Wide, sun-bleached, sparse. Posters are notices pinned to a board. Hero = the frame *widens* to a horizon (the inverse of Horror's close-in).

**Motion character (spare / weighted).** Long, heavy holds (600–900ms, high damping so things "land" with weight), wide gaps (120ms+), minimal stagger (the west is empty, not busy). Signature: cards slide in from the side and settle with weight (low stiffness, high damping). Scroll-snap rails feel like riding between towns. Reduced-motion → sharp fades, no slide.

**Type register.** Cabinet Grotesk display at wide, confident tracking, sturdy weight (a "woodcut" feel without a new font), ALL-CAPS for the hero name. Eyebrows in Geist Mono as distances/years (`1870s · FRONTIER`). Body Geist plain, blunt. The genre *reads* like a printed notice.

**Sound beat-map (dry, sparse, final).** `tick` = selecting, like loading a chamber, one per. `toggle` = a decision made. `success` on save = a name added to the board. **Withheld:** `sparkle`, light `chime`. The west is dry; sound is sparse and final.

**Companion register: "The Trail Guide."** Lexicon: the land, the ride, what's worth the distance, the hard country, the town, the well-worn trail. Tempo: plain, a little laconic, comfortable with silence. Opening question: "How far out do you want to ride?" Frames recs as "this one's a long haul but it pays off." Same voice, weathered.

**Emotional arc.**
- *Entry:* a vastness. The horizon duotone wipe, the frame opens. You feel small against the land, calm. A little lonely, in a good way.
- *Immersion:* the Map/Geo view (origin regions) and Watch-Order (sagas) read like planning a route. You feel the scale, the patience.
- *Guided:* the Trail Guide wakes and doesn't oversell: "I'd start you at the well-worn trail." Walks canon → deep cut. You feel accompanied by someone who *knows the country*.
- *Closure:* a quiet coda, "the trail continues north." You leave with a sense of having *ridden* somewhere, not browsed.

---

### 2.6 ANIME — "The Panel"

**Spatial metaphor.** A panel / splash page / a hand-drawn frame. Varied, kinetic, ink-and-light. Posters are frames in a spread. Hero = the page "opens," color arrives.

**Motion character (kinetic / expressive, disciplined).** Varied durations (some snappy 200ms for energy, some soft 600ms), lively stagger (50–70ms) but not chaotic, `rotateX` tilt allowed (the "deal" flips like cards). Signature: one bounded "panel flip" on the hero transition. Reduced-motion → sharp fades, no tilt, no flip.

**Type register.** Cabinet Grotesk display at its most expressive optical setting; title names may go *italic* (a manga-title vibe); tighter tracking for energy. Eyebrows in Geist Mono as medium grammar (`24 EPS · SHONEN` · `STUDIO: MAPPA`). Body Geist bright, punchy. The genre *reads* like the medium it is.

**Sound beat-map (the most energetic profile, still cue-only).** `sparkle` = the mood-match / "a new signal" (anime owns delight). `tick` = selecting an episode/season. `success` on save. `bloom` on companion wake = an excited "I'm here!" 

**Companion register: "The Fan at the Next Desk."** Lexicon: arc, episode, the studio, the adaptation, what it's really about underneath. Tempo: energetic, knows the medium, one playful beat ("sub or dub?"). Opening question: "Studio person, or story person?" Frames recs as "this studio never misses" / "the manga is better but the anime lands the ending." Same voice, a fan.

**Emotional arc.**
- *Entry:* a spark. The page-flip duotone wipe, color arrives. You feel a grin: this is yours.
- *Immersion:* the Watch-Order (seasons/sagas) and Cluster Graph (studio/theme) read like knowing the medium's grammar. You feel fluent in it.
- *Guided:* the Fan wakes (`bloom`, bright) and talks like a friend who gets it: "you're a studios person, so start here." You feel *known as a fan*.
- *Closure:* `sparkle`/`chime`, a coda like "next season drops Friday." You leave hyped, with a queue.

---

## 3. The sensory layer, at a glance

| Channel | Sci-Fi | Horror | Documentary | Romance | Western | Anime |
|---|---|---|---|---|---|---|
| **World** | Constellation | Threshold | Reading room | Warm interior | Frontier | Panel |
| **Motion** | Glacial/precise | Visceral/erratic | Measured/earnest | Tender/breathing | Spare/weighted | Kinetic/expressive |
| **Type read** | Console | Held breath | Editorial | Letter | Notice | Manga |
| **Sound profile** | Cool/distant | Near-silence | Library-quiet | Warmest | Dry/sparse | Energetic |
| **Companion** | Navigator | Lamplighter | Archivist | Confidant | Trail Guide | Fan |
| **Dominant cue** | sparkle (signal) | bloom (presence) | tick (source) | chime (close) | toggle (decision) | sparkle (delight) |
| **Withheld cues** | success-light | sparkle, chime | none | none | sparkle, chime | none |

---

## 4. How immersion + curation + AI-guided COMBINE (one arc, not three features)

This is the answer to "is it rich enough." The three layers are not stacked widgets; they are **one continuous descent** with the Companion as the spine.

- **Curation (rails)** = *what's here.* Canon / deep cuts / your echoes. On their own, shelves.
- **Immersion (genre module elements)** = *look closer.* Timeline, Cluster Graph, Map, Watch-Order. These are the **rooms** of the world, the stages the docent walks you through.
- **AI-guided (Companion docent)** = *why, and what next.* The narrative spine that turns shelves + rooms into a journey.

**The braid (per session):**
1. **Threshold** — the genre-gate wipe drops you into the world's hero. (Immersion begins.)
2. **Rails as chapters** — the curated rails appear *named by the docent* ("Canon," "Your Echoes," "The Deep Cuts"), not as generic shelves. (Curation is narrated.)
3. **Rooms on cue** — when the docent says "look closer at how this era splits," that line *triggers* the immersion element (Timeline / Cluster Graph). The module is motivated by narrative, never a random widget. (Immersion is invited, not imposed.)
4. **Whispers per pick** — each title's `AnchorFrame` ("like **X**, but diverges") is the docent's grounding, reusing `insightService.ts:263-273`. (Curation is personalized.)
5. **Coda** — the docent's close hands you the next branch or back to Shell. (Guided closure.)

You never "use a feature." You are walked through a world by a guide who knows your taste. That braiding is the richness.

**Anti-stale = part of the feel.** `anchorService` (fatigue/retire) means the docent always picks the *lowest-fatigue* neighbor and rotates on revisit. Even a return visit to the same world feels new. Richness survives repetition.

**Reduced-motion parity of the combine.** Under `prefers-reduced-motion`, the braid holds with zero transform animation: the threshold is an opacity crossfade, rooms appear on docent *copy* ("step into the 1970s"), and the docent's voice carries the atmosphere that motion would have. The arc is completable and felt.

---

## 5. The FEEL CHECKLIST (per genre, measurable)

### 5.1 Shared bars (every world must pass)
- **Time-to-immersion:** ≤1.5s from genre-gate keyframe to first atmospheric beat; hero LCP < 2.5s (the tint wipe + hero copy is the LCP).
- **Emotional-arc completeness:** session emits phase events in order `landed → immersing → guided → closing`; target ≥ 60% of genre sessions reach `closing` (completion rate).
- **Reduced-motion parity:** under `prefers-reduced-motion`, all 4 phases reachable with zero transform animation; axe + manual audit confirms the *feel* survives via opacity/state/copy.
- **Contrast:** axe-core 4.5:1 on every genre duotone over ink-950; automated pass on sampled worlds.
- **Targets:** every interactive (genre chips, rail arrows, docent controls, mood toggle, cluster nodes) ≥ 44×44px.
- **Perf:** LCP<2.5s, INP<200ms, CLS<0.1 on mid-tier Android (route-split, reserved space, `content-visibility:auto`).
- **Sound discipline:** every `playCue()` in the genre flow maps to a matrix moment; zero cues on nav-by-link or scroll; reduced-motion ⇒ 0 sounds. Audited via the sound-coverage matrix.
- **One agent, no fork:** build review confirms `genreCuratorPrompt` reuses `luminaSystemPrompt` + `buildChatContext`; the register is a data block, not a new system prompt, not a new model call.
- **No fatigue regression (R3):** median `fatigueScores` of loved titles does NOT rise after launch; anchor-uniqueness (distinct cited `tmdbIds`) increases in guided mode.

### 5.2 Per-genre feel metrics (the "is it rich enough" gauges)

| Genre | Primary feel metric | Target signal |
|---|---|---|
| **Sci-Fi** | % guided sessions that reach the constellation / era-map | spatial metaphor *felt*, not just seen |
| **Horror** | bounce rate from world; "lights on" coda tap rate | people *stay* in the dread; safe exit chosen |
| **Documentary** | source-divergence views; topic-cluster expansion rate | credibility layer *engaged* |
| **Romance** | save-to-watchlist rate from world; "tonight" pick rate | emotional investment → action |
| **Western** | map/geo engagement; watch-order adoption | the *ride* is taken, not skimmed |
| **Anime** | watch-order (season) adoption; mood-match handoff rate | medium fluency activated |

### 5.3 Per-genre checklist ticks (concrete, auditable)
- **Sci-Fi:** constellation renders ≤ LCP budget; `sparkle` fires only on mood-match; Navigator copy present in intro hook; era-map reachable from docent line.
- **Horror:** `sparkle`/`chime` absent from the world's sound calls; flicker is opacity-only and gated by reduced-motion; Lamplighter copy present; "lights on" coda exists.
- **Documentary:** credibility tier renders as typographic metadata (not color-only); Archivist cites POV in intro; source ribbon ticks per source.
- **Romance:** cards settle without `rotateX`; `chime` on coda; Confidant copy present; "watch tonight" coda exists.
- **Western:** hero widens (not narrows); `toggle` maps to decisions; Trail Guide laconic copy present; map reachable.
- **Anime:** panel-flip is transform-only and reduced-motion-safe; `sparkle` on mood-match; Fan copy present; watch-order reachable.

---

## 6. Build-gate implications (for the parent plan)

1. The genre world is **data-driven, not six code paths.** A `genreWorld` config object carries: `spatialMetaphor`, `motionProfile` (duration/stiffness/stagger overrides + signature gesture flag), `typeRegister` (tracking/weight/case params), `soundMap` (beat → cue, incl. withheld list), and `companionRegister` (lexicon/tempo/question block). One component reads six configs.
2. **Type and motion are parameter maps over the locked system** — zero new fonts, zero new easings. This keeps the anti-slop contract intact.
3. **Sound needs no new cues** — only a per-world `soundMap` deciding which beats fire which of the 10 existing cues, and which are withheld. If `lib/sound.ts` cues aren't delivered, the worlds still hold (motion + type + voice carry the feel); sound is the cut-candidate, not a blocker.
4. **The Companion register is a prompt-adjacent data block**, appended in `genreCuratorPrompt` alongside the reused `luminaSystemPrompt`. No second agent, no new system prompt, no new LLM call. Risk R7 (persona consistency) is satisfied by construction.
5. **Reduced-motion is a first-class feel, not a fallback.** Each world specifies its opacity/state/copy-only arc so `prefers-reduced-motion` users get the same emotional journey.

---

*Synthesis complete. No code written. Pairs with the architecture plan and the element inventory; the `genreWorld` config shape in §6 is the hand-off to the build strand.*
