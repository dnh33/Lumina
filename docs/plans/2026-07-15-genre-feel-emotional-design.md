# Genre Deep-Dive: The 'Feel' / Emotional-Experience Design

> **⚠ CORRECTION (2026-07-15):** This companion doc was written against the unverified Phase-1 font/accent assumption. The **real** app tokens (verified in `client/src/theme.css`) are:
> - Accent: **`gold-400 #e8b84b`** (active/rating) + **`amber-400 #fbbf24`** (passive "over-used" nudge) — NOT "Projector Amber #E0A868".
> - Fonts: **`--font-display: "Fraunces", serif`** + **`--font-sans: "Inter", sans-serif`** (theme.css:32-33) — NOT Cabinet Grotesk/Geist/Geist Mono.
> Where this doc says "Cabinet Grotesk/Geist/Geist Mono" or "Projector Amber", read it as the real Fraunces/Inter + gold/amber stack (decide in build whether to migrate). The *per-genre modulation concept* (register variation, not new families) still holds. The master doc `2026-07-15-immersive-genre-experience-design.md` §13.1 is the corrected source of truth.

> **Strand:** emotional arc + sensory/aesthetic layer per genre, BEYOND a color tint.
> **Status:** Synthesis (no code). Pairs with `2026-07-15-immersive-genre-experience-design.md` (IA/architecture) and the locked system in `client/src/theme.css`, `client/src/lib/motion.ts`, `client/src/lib/sound.ts`, `node_modules/cuelume`.
> **Hard constraints honored:** one accent (gold `#e8b84b`), dark-locked, no Inter/serif-default (world uses Cabinet Grotesk + Geist + Geist Mono), em-dash BANNED, transform/opacity-only motion, reduced-motion parity of *feel* (not just removal), 4.5:1 contrast, 44px targets, LCP<2.5s / INP<200ms / CLS<0.1. Sound = opt-in one-shot cues only, muted under `prefers-reduced-motion` (`sound.ts` policy). Single Companion voice, NO second LLM agent (R7).

---

## 0. The core thesis: tint is the cheapest 5% of feel

A per-genre duotone on the hero is necessary but nowhere near sufficient. The deep-dive must produce a *coherent emotional arc* so the user leaves feeling something specific, not just "I saw sci-fi posters in teal." The four real levers of feel, all layerable on the locked system:

1. **Sound** (opt-in cues from the 10-name cuelume catalog only).
2. **Typography voice** (modulation of Cabinet Grotesk / Geist axis + tracking + scale, within the genre's tone).
3. **Motion character** (transform/opacity recipes from `lib/motion.ts`, retuned per genre).
4. **Spatial metaphor** (what "the world" *is* — constellation, cabin, archive, etc.).
5. **Companion register** (same voice, genre-specific lexicon, as the docent).

Plus the engine that fuses them: **immersion sets the register, curation shapes it to the user, the Companion narrates it.** See §3.

### Sound palette (the only cues that exist) and their raw affect
| Cue | Shape | Raw affect (pre-genre) |
|---|---|---|
| `bloom` | warm pad swell | arrival, settling, warmth |
| `chime` | two-note ascending bell | confirm, ascend, note-taken |
| `droplet` | single water drop | singularity, tension, a drop in dark |
| `press` | UI press | neutral control acknowledgment |
| `release` | soft let-go | exhale, closure, reins-loosened |
| `sparkle` | bright 4-note twinkle | joy, pop, kinetic |
| `success` | completion | done, arrived |
| `tick` | small metronomic tick | precision, a record beginning, a step |
| `toggle` | state switch | picker / mode change |
| `whisper` | breathy noise | intimacy, wind, closeness, the dark |

All fire ONLY on explicit user intent (hover, select, chapter advance, Take reveal, exit) via `playCue(name)`. No ambient loops, no autoplay. Under `prefers-reduced-motion` `sound.ts` forces mute, so the feel must never depend on sound.

---

## 1. Emotional arc per genre (entry → immersion → guided → closure)

Concrete and sensory. Each arc names the feeling at every beat and the *mechanism* that produces it.

### Sci-Fi
- **Entry (crossing the threshold):** *wonder + smallness-before-vastness.* The genre-gate floods the screen with a cool duotone; the hero resolves into a precise, ordered frame. You feel you have stepped onto a bridge looking out at something large and calm. Cue: `bloom` (settle into space).
- **Immersion:** *expansive calm, attentive awe.* Rails read as orbits; posters as charted stars. Motion is slow and exact. You are orienting, not rushing.
- **Guided:** *discovery as revelation.* The Companion-as-Navigator names each title's coordinates relative to films you love ("Two degrees from *Arrival*"). Each reveal feels like a star being plotted. Cue on chapter: `tick`.
- **Closure:** *oriented, equipped, calmly awed.* You exit knowing the shape of the world and what to watch next. Cue: `success` (quiet).
- **One-line feel:** "I am small, the cosmos is legible, and someone handed me the map."

### Horror
- **Entry:** *apprehension + a dare.* The gate is dark, the duotone near-black oxblood, the frame encloses rather than opens. You feel invited into something you are slightly afraid of. Cue: `whisper` (breath, close) or `droplet` (a single drop in the dark).
- **Immersion:** *tense containment, senses heightening, safe-thrill.* Low ceiling, one gold light, negative space that feels like it is watching. Motion is slightly off-kilter. You are held, not rushed.
- **Guided:** *a steady hand in the dark.* The Companion stays with you and names the fear plainly ("This one earns its silence"). The scares are framed, not sprung. Cue on Take reveal: `release` (the tension resolved).
- **Closure:** *exhale, catharsis, "I made it through."* The world lets go. Cue: `release` (a long exhale) or `success`.
- **One-line feel:** "I was afraid, and I was safe the whole time, and that was the point."

### Documentary
- **Entry:** *curiosity + earnest openness.* The gate is plain and labeled; the duotone is muted steel. You feel invited to learn, not to be thrilled. Cue: `tick` (a record beginning) or `bloom`.
- **Immersion:** *absorbed, grounded attention.* Rails are subject rows; everything is findable and dated. Motion is even and reliable. You trust the frame.
- **Guided:** *a patient teacher.* The Companion gives context and evidence ("Filmed the same year as X. Worth knowing why."). Cue on anchor note: `chime`.
- **Closure:** *informed, moved, clear-eyed.* You leave knowing something you did not. Cue: `success`.
- **One-line feel:** "I came to look, I left knowing."

### Romance
- **Entry:** *anticipation + soft warmth.* The gate is intimate, the duotone warm, the title set close and large. You feel a lean-in. Cue: `whisper` (intimacy) or `bloom`.
- **Immersion:** *emotional openness, intimacy.* Scale is personal, not vast; glow is warm on the active card. Motion is gentle and leaning.
- **Guided:** *a confidant who knows your heart.* The Companion uses you/your and names feelings ("You love the ones that earn the ending."). Cue on chapter: `whisper`.
- **Closure:** *warmth, recognition, a small smile.* Cue: `release` (a sigh) or `success`.
- **One-line feel:** "It saw my heart and said 'yes, that one.'"

### Western
- **Entry:** *stillness, a held breath, wide openness.* The gate is a long low line; the duotone is sun-bleached amber-dust. You feel the quiet of an empty land. Cue: `whisper` (wind) or `droplet` (a single distant note).
- **Immersion:** *solitude, weathered calm, vastness.* Rails are stretches of road; posters are markers. Motion arrives slowly and holds (the "draw").
- **Guided:** *a pragmatic trail guide.* The Companion is plain and dry, place-and-weather aware ("Rides out where the light goes long."). Cue on chapter: `tick` (a step forward).
- **Closure:** *settled, steady, a done deal.* Cue: `release` (reins loosened) or `success`.
- **One-line feel:** "The land is empty, the light is long, and I am steady in it."

### Anime
- **Entry:** *spark + bright curiosity.* The gate pops (within the duotone cap); the duotone is vivid. You feel a lift. Cue: `sparkle` or `chime`.
- **Immersion:** *kinetic joy, discovery, color-pop.* Rails are panels; motion is springy. You feel invited to play.
- **Guided:** *an excitable kindred spirit.* The Companion is bright and short ("This one? This one understands you."). Cue on chapter: `sparkle`.
- **Closure:** *lift, energized, "next!"* Cue: `success` (bright) or `sparkle`.
- **One-line feel:** "I grinned, and I already want the next one."

---

## 2. Sensory / aesthetic layer per genre (beyond the tint)

Each axis is expressed *within the locked system*. The tint is a duotone opacity crossfade on ambient/hero layers ONLY (an `opacity` transition of a pre-rendered layer, transform/opacity-compliant). It is never a second accent and never touches chrome/text/contrast.

### Feel Signature table
| Genre | Spatial metaphor | Motion character | Type voice (Cabinet Grotesk / Geist / Geist Mono) | Sound set (cues) | Companion register |
|---|---|---|---|---|---|
| Sci-Fi | Constellation / star chart | Precise, glacial | Heavy display, tight tracking; Mono = coordinates | bloom, chime, tick | Navigator / Cartographer |
| Horror | The cabin / the basement | Visceral, off-kilter | Lighter display, wide tracking (unease); heavy titles loom | whisper, droplet, release | The one who stays in the dark |
| Documentary | The archive / reading room | Measured, even | Moderate display, generous leading; Mono = dates/figures | tick, chime, bloom | The researcher / docent |
| Romance | The window seat / the letter | Gentle, leaning | Lighter display, loose tracking, intimate scale | whisper, bloom, chime | The confidant |
| Western | The trail / the horizon | Weathered, slow-draw | Heavy display, condensed tracking, uppercase eyebrows | whisper, tick, release | The trail guide |
| Anime | The page / the frame | Kinetic, springy | High-weight display, dynamic mixed tracking, bold scale jumps | sparkle, chime, bloom | The kindred spirit |

### 2a. Sound mapping (event → cue, per genre)
Events are the SAME across genres; the cue assigned shifts the affect. All opt-in, all reduced-motion-muted.

| Event | Sci-Fi | Horror | Documentary | Romance | Western | Anime |
|---|---|---|---|---|---|---|
| Threshold (enter world) | bloom | whisper | tick | whisper | whisper | sparkle |
| Poster hover | tick | press | press | press | press | sparkle |
| Anchor-frame reveal (echoes/diverges) | chime | droplet | chime | chime | chime | chime |
| Chapter advance (guided) | tick | whisper | tick | whisper | tick | sparkle |
| "Take" reveal | bloom | release | bloom | bloom | bloom | bloom |
| Closure / exit | success | release | success | release | release | success |

Rule: never assign `sparkle` to Horror or Documentary (wrong affect); never assign `whisper` to Sci-Fi's precision beats (reserve for intimacy genres). The catalog is fixed at 10; no new cues without cuelume changes.

### 2b. Typography voice (modulation, not new fonts)
Locked stack: **Cabinet Grotesk** (display) + **Geist** (body) + **Geist Mono** (data/metadata). No Inter, no serif default. Per-genre modulation:
- **Sci-Fi:** display heavy (700), tracking `-0.02em`, Mono for years/runtime/coordinates as "data". Optical: architectural, no wonk.
- **Horror:** display light (400) with wide tracking `+0.06em` for unease; titles that must loom use heavy (700) but isolated. Body Geist, low contrast-safe.
- **Documentary:** display moderate (500), normal tracking, generous line-height; Mono for dates/citations as evidence.
- **Romance:** display light (400), loose tracking `+0.04em`, intimate large scale (not vast); warm set close.
- **Western:** display heavy (700), condensed feel via tight tracking `-0.03em` + uppercase eyebrows; Mono for years/places.
- **Anime:** display high-weight (700/800), dynamic mixed tracking (some tight, some loose), bold scale jumps between tiers for energy.

### 2c. Motion character (transform/opacity recipes only, retuned from `lib/motion.ts`)
All use `EASE_OUT_EXPO` entrances and `posterDeal`/`stagger60` as base. Retune per genre:
- **Sci-Fi (glacial/precise):** `posterDeal` slowed: stiffness 180, damping 30, mass 1.2; `staggerChildren 0.09`; entrance `y:28→0` over ~700ms; constellation motif via `offset-distance` orbit (4s linear, transform-only). Everything lands exactly.
- **Horror (visceral/off-kilter):** non-uniform stagger array (varied delays, not the 60ms baseline); `rotateX` varies per card (−6 to −10, asymmetric); a slow `scale 1→1.04→1` 1.2s loop on the active frame; slight `translateX` offsets. Controlled unease, never jank. No orbit.
- **Documentary (measured/even):** `staggerChildren 0.06` exact, `y:16`, NO rotate, straight translateY. Reliable cadence = trustworthy.
- **Romance (gentle/leaning):** stiffness 240, damping 26 (soft); `y:14` + `scale 0.98→1`; one slow breath loop 4s (disabled under reduced-motion).
- **Western (weathered/slow-draw):** stiffness 140, damping 34 (heavy); `delayChildren 0.12`; one slow `translateX` drift 20s (wind). Things arrive and HOLD, no bounce.
- **Anime (kinetic/springy):** stiffness 360, damping 18; `staggerChildren 0.045`; `rotateX -14`; spark orbit `offset-distance` 2s. Joyful, not erratic.

### 2d. Spatial metaphor (what "the world" is)
- **Sci-Fi = constellation:** the world is a star chart; rails are orbits; poster = a plotted star; the Companion narrates coordinates.
- **Horror = the cabin:** enclosed, low ceiling, one gold light, walls close; rails are corridors; negative space watches.
- **Documentary = the archive:** orderly shelves, a desk, things labeled; rails are subject rows; the Companion cites.
- **Romance = the window seat:** close, personal, a conversation across a table; rails are "ways your heart has gone."
- **Western = the trail:** wide, low, a single horizon line; rails are stretches of road; posters = markers.
- **Anime = the page:** comic-panel grid, a flipbook; rails are panels; the Companion is a margin note.

The metaphor drives layout family choice (from the 5 in the architecture doc) AND the copy. It is the through-line that makes curation feel like "things that belong here" rather than a grid.

### 2e. Companion voice shift (SAME voice, genre register only)
Hard rule: guided mode reuses `chatService.runChatTurn` with a prefilled message + focused prompt. NO new system prompt, NO second agent (R7). The "shift" is **register/lexicon only**, applied as a small per-genre phrase bank the prefill/curation prompt draws from. The base Companion voice (calm, present, attentive, copy-led) is unchanged.

| Genre | Register shift (lexicon only) | Example line |
|---|---|---|
| Sci-Fi | spatial, precise, calm wonder | "Two degrees from *Arrival*. Charted for you." |
| Horror | steady, names fear plainly, comfort-through-steadiness | "This one earns its silence. I'll stay with you." |
| Documentary | plain, cites, contextualizes | "Filmed the same year as X. Worth knowing why." |
| Romance | warm, personal, you/your, names feelings | "You love the ones that earn the ending." |
| Western | pragmatic, dry, place/weather aware | "Rides out where the light goes long." |
| Anime | bright, short, excitable | "This one? This one understands you." |

Guardrail: a copy-reviewer checks guided copy against the base voice spec. If a line would not be spoken by the SAME Companion in Discover, it is rejected. The register is a vocabulary constraint, not a persona fork.

---

## 3. How immersion + curation + AI-guided COMBINE into one feel

They are not three features stacked. They are one arc seen from three sides:

- **Immersion (the world/atmosphere)** sets the *emotional register* (Sci-Fi = vast/calm, Horror = held/tense). Without it, curation is a grid. With it, curation is "things that belong in this place."
- **Curation (rails + anchor-framing + anti-fatigue)** provides the *shape*, and crucially it is shaped by the USER (`topGenres`, fatigue-aware neighbor selection, retired anchors dimmed). So the world is not generic: it is a world *made from your taste*. The anchor-frame ("like X, but diverges") is the moment curation meets immersion: a title is placed IN the world relative to what you love.
- **AI-guided (single Companion as docent)** provides the *narration* that fuses the two: it names WHY a title belongs in THIS world and to YOU, turning browsing into a guided descent. The Companion's per-genre register (§2e) is the literal seam: the same voice that built the world's atmosphere speaks the curation.

The combined feel = **"a place made for me, shown to me by someone who gets me."** Immersion without curation is a screensaver. Curation without immersion is a list. Guided without the other two is a chatbot. Only the fusion produces the genre arc in §1.

Mechanism note: the fusion is enforced structurally, not by luck. The genre tint + metaphor (immersion) are the page shell; the rails are seeded from `topGenres` + `filterCatalog` + fatigue-sorted neighbors (curation); the guided path is the SAME Companion prefilled with the genre register (narration). A user who enters self-directed still gets immersion + curation; the Companion simply stays idle until invoked. The feel degrades gracefully, it does not break.

---

## 4. Feel checklist per genre (measurable)

Each genre build must hit every row. "RM" = reduced-motion parity requirement (feel preserved, not just removed).

| # | Check | How measured | Target |
|---|---|---|---|
| F1 | **Time-to-immersion** | LCP on world route + threshold animation duration; session replay from entry to first settled hero frame | Immersed by ~3.0s (LCP<2.5s, threshold ≤600ms) |
| F2 | **Emotional-arc completeness** | Session reaches Coda / exits via "done" (reuse metric #2) | >=60% of world sessions complete the 4 beats |
| F3 | **Spatial metaphor integrity** | Design audit: layout family + copy consistently use the genre metaphor; no orphan generic grid | 0 metaphor violations per genre |
| F4 | **Sound parity (sound-off still feels)** | Mute test: run world with cues disabled; arc in §1 must still read | Feel intact with sound OFF |
| F5 | **Reduced-motion parity of FEEL (RM)** | Toggle `prefers-reduced-motion`; verify each motion cue has a static-equivalent (see §2c mapping below) and the 4-beat arc still reads | Arc complete under RM; no meaning lost to motion |
| F6 | **Single accent + 4.5:1 contrast** | axe-core on sampled worlds; gold-only accent audit | axe pass; accent count <=3/screen |
| F7 | **Companion register consistency** | Copy review vs base voice spec (§2e); reject lines the base Companion would not say | 0 persona-fork lines |
| F8 | **Anti-fatigue honored (R3)** | `fatigueScores` of loved titles must NOT rise post-launch (metric #6); code review: no `logAnchor` on impression/scroll | Zero new anchor writes on view |
| F9 | **Performance budgets** | Lighthouse / field on mid-tier Android: LCP, INP, CLS | LCP<2.5s, INP<200ms, CLS<0.1 |
| F10 | **Touch + a11y floor** | 44px targets, focus-visible gold ring, heading hierarchy, alt="" on decorative backdrops | 100% of targets >=44px; 0 focus regressions |
| F11 | **Anti-slop literals** | Lint: no em-dash in copy/UI strings; dark-locked; no Inter/serif-default in world type | 0 em-dashes; world type = Cabinet Grotesk/Geist |

### Reduced-motion static-equivalence map (F5)
| Genre | Motion character | Static equivalent that preserves the FEEL |
|---|---|---|
| Sci-Fi | glacial/precise | Exact grid alignment + still hairline rules + Mono coordinates; orbit becomes a static dotted constellation diagram |
| Horror | visceral/off-kilter | One off-center, high-contrast still frame + heavier static vignette + generous negative space; unease reads from composition |
| Documentary | measured/even | Even spacing + clear labels; inherently static-friendly; no change needed |
| Romance | gentle/leaning | Intimate scale + one static gold glow on active card; warmth from composition |
| Western | weathered/slow-draw | Still long-horizon composition + static dust gradient; the "hold" is the frame itself |
| Anime | kinetic/springy | Dynamic asymmetric panel layout + bold type-scale jumps; energy reads from layout, not bounce |

Every genre therefore has a *zero-motion* path that still delivers its §1 arc. This is the test that separates "reduced-motion supported" from "reduced-motion parity of feel."

---

## 5. Open flags for the build strand
- **Type stack fork:** the world uses Cabinet Grotesk/Geist (satisfies "no Inter/serif-default"); the rest of Lumina is Fraunces/Inter. Confirm self-hosting vs the named `Satoshi` fallback before build. The feel design above assumes Cabinet Grotesk/Geist is approved; if not, re-map §2b onto Satoshi.
- **Sound catalog is fixed at 10:** if a genre needs an affect not coverable (e.g. a "creak" for Horror), that is a cuelume change, out of scope for v1. Current mapping stays within the catalog.
- **Guided register is a phrase bank, not a prompt fork:** must be implemented as a lexicon constraint on the existing prefill, never a second `luminaSystemPrompt`. Enforce in code review (R7).
