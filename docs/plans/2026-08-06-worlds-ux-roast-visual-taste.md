# Worlds UX Roast — Visual Taste · Anti-Slop Aesthetics

**Agent:** Roast 2/4  
**Date:** 2026-08-06  
**Target:** `http://localhost:5173` — `/genre`, Documentary, Horror, Map  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Lens:** Visual hierarchy, density packing, gold discipline, type, map readability, AI tells  
**Method:** Live browser evidence + computed-style audits. No implementation. No git.  
**Preserve:** Dark cinematic archive, world accents, Instrument Ink / booth vocabulary.  
**Banned prescriptions:** Purple AI haze, cream-terracotta craft palette, Inter stacks, “quieter = greyer.”

---

## Design Read

**Reading this as:** redesign-preserve of a cinephile vault product surface (not a marketing landing), for a density-tolerant builder-cinephile, with a hush / projection-booth language, leaning toward Instrument Ink (Cabinet + Geist + rationed gold) already declared in `theme.css` and `.impeccable.md`.

**Dials (inferred from brand + what the UI actually needs):**

| Dial | Declared intent | Live reading | Gap |
|------|-----------------|--------------|-----|
| `DESIGN_VARIANCE` | 5–6 (booth geometry, not gallery chaos) | ~4 — repeated equal cards + equal chips | Variance is simulated by metaphor labels, not composition |
| `MOTION_INTENSITY` | 4–5 (state, not theatre) | Fine if anything | Not the problem |
| `VISUAL_DENSITY` | **7–8** (archive cockpit: packed, beautiful) | Oscillates **2 ↔ 9** | Heroes/doors = gallery air; mood/tags = pill soup |

Density is the aesthetic story. Right now Worlds is **empty where it should be rich**, and **cramped where it should be curated**.

---

## Verdict

The booth *intent* is visible — carbon ink, grain, reg-ticks, ghost numerals, world-edge needles — but the **display voice is dead at runtime**, gold is doing three jobs at once, and the hub/map/world pages keep restating the same status chrome. It reads half-finished not because it’s ugly, but because **two type systems and two accent systems are fighting on one stage**.

| Surface | Taste health | One-line roast |
|---------|--------------|----------------|
| Hub hero | Weak | Oversized “Worlds” + 18rem watermark for a count you already print as legend |
| Atlas doors | Mediocre | Equal card grid with empty mid-card air; metaphor is eyebrow spam |
| By mood | Fail | 36 equal pills = Letterboxd chip soup (explicit anti-reference) |
| Map | Promising / muddled | Best original object; ruined by indigo territory + gold focus inflation + faint warps |
| Documentary / Horror hero | Weak | Same oversized ghost numeral pattern; H1 not Cabinet |
| Guided tour desk | Strongest | Best Instrument Ink object — then drowned by chrome below |
| Companion FAB / Shell gold | Inflated | Gold on nav + filled + brackets + FAB + CTAs = no hierarchy |

**Anti-slop test:** “Would someone believe AI made this?” — **Partial yes.** Not purple-mesh SaaS, but: equal card grid, pill clouds, uppercase micro-labels everywhere, indigo/violet world accents, Sparkles-as-AI, and a broken display font that collapses everything to Geist.

---

## Evidence before prescriptions (why it looks unfinished)

Systematic check — five hypotheses → two survivors → validated:

| # | Hypothesis | Result |
|---|------------|--------|
| 1 | Cabinet Grotesk never loaded | **False** — `document.fonts` includes Cabinet Grotesk + Geist |
| 2 | Display titles use a broken Tailwind path | **True** — `font-display` utility → Cabinet; `font-[var(--font-display)]` → Geist |
| 3 | Gold is literal signal-only | **False** — markup on Horror Guided: ~155 `gold-*` / `#e8b84b` refs; ~127 `--world-accent` refs |
| 4 | World accents avoid purple family | **False** — sci-fi `#6366f1`, fantasy `#7c3aed`, noir `#8b5cf6`, mystery `#c084fc`; map Constellation fill `rgba(99,102,241,0.12)` |
| 5 | Hub density is consistent | **False** — Atlas cards have dead vertical air; By mood packs 36 chips; Map focus strip leaves a black void beside “Enter” |

**Root causes (1–2):**  
1. **Display register is wired but not applied** on Worlds titles (H1 “Worlds”, door titles, Guided H2, Timeline heads). Logo (`font-display`) is the rare place Cabinet actually shows. Instrument Ink’s “three voices, never trade jobs” collapses to one voice.  
2. **Signal color and world accent both scream** — gold for Shell / filled / reg-ticks / FAB / Enter; world-accent red for Horror Watchlist; indigo/violet for sci-fi/fantasy territories. Hierarchy becomes “everything warm or loud.”

---

## What’s working (keep)

1. **Tour desk composition** (Horror/Documentary Guided) — dials as physical booth controls, shelf as consequence. This is the aesthetic thesis. Protect it; starve everything else until it finishes speaking.
2. **World-edge needle on Atlas doors** — thin left accent, not a rainbow badge. Correct booth move when the rest of the card isn’t empty.
3. **Map idea** — metaphor landmasses + kinship warps is distinctive and on-brand. Do not replace with a card grid; **fix territory chroma and warp contrast**.
4. **Carbon + grain + mist neutrals** — ink theatre is right. Do not “quiet” by greying further.

---

## Priority issues (visual)

### P0 — Display font never reaches Worlds titles

**What:** Computed `font-family` on hub H1 and Horror H1 is Geist. Arbitrary class `font-[var(--font-display)]` does not resolve; utility `font-display` does.

**Why it matters:** Without Cabinet, “Instrument Ink” is a comment in `theme.css`. Titles feel like a default SaaS app wearing booth chrome (reg-ticks, grain) as costume.

**Fix direction (`/typeset`):** Replace every Worlds `font-[var(--font-display)]` with `font-display` (or fix the arbitrary path once). Verify H1/door/tour heads paint Cabinet at weight 600–700. Keep Geist for controls/prose. Do **not** swap to Fraunces here unless the whole product reverts the Instrument Ink decision — dual briefs (`.impeccable` Fraunces vs theme Cabinet) are already confusing; pick one and ship it.

---

### P0 — Gold inflation vs world-accent competition

**What (live):**  
- Shell: active Worlds = gold fill/ring; logo star = gold.  
- Hub: filled status = gold glow dot; reg-ticks = `--signal` gold; ConstellationBackdrop accent gold.  
- Map: focus warps + Enter CTA + filled Horror node all gold.  
- Horror Guided: Watchlist buttons = world-accent red; FAB = solid gold; brackets = gold.

**Why it matters:** Brand rule is “gold = earned/active fuel.” When gold also frames every panel and lights every status, world accents cannot stage genre. Horror’s red Watchlist fights the gold FAB for “primary.”

**Fix direction (`/quieter` on gold, `/bolder` on one focal):**  
- Gold jobs max three per viewport: (1) nav/active location, (2) one primary CTA or filled proof, (3) live companion.  
- Reg-ticks: mist/etched, not signal gold — geometry without fuel.  
- Filled status: can stay gold (earned), but then **Enter CTA** should be world-accent or lacquer white — not a second gold brick.  
- Watchlist: either world-accent *or* gold — never both families as filled primaries in the same shelf row.

---

### P0 — Density bipolar disorder (gallery air vs pill soup)

**What:**  
- Hub hero: `ghost-numeral` at **18rem**, `sm:text-6xl` H1, large padding — ~⅓ viewport for legend you repeat under Atlas and Map.  
- Atlas doors: metaphor + status + title + one-line tone, then a **dead band**, then “N titles.” Equal 3-col card grid.  
- By mood: **36** capitalized chips, identical weight — plus Archive chip strip — anti-reference “pill soup” hit hard.  
- World Self steer (from Documentary Guided snapshot): tag row Action…War + Surprise + Less well-known = second chip cloud under an already verbose page.

**Why it matters:** Beautiful density packs *related* data tight and gives *one* element air. Here air is wasted on watermarks; packing is wasted on unordered adjectives.

**Fix direction (pack beautiful, not sparse):**  
- **Hero:** cut ghost numeral to a quiet mono meta (or drop); H1 `text-3xl sm:text-4xl`; status legend once (hub only, not thrice).  
- **Atlas:** compress door vertical rhythm — title+tone+count as one tight stack; filled doors denser (poster strip / shelf heat), empty doors quieter — **asymmetric density by status**, not equal cards.  
- **Mood:** 6–8 curated entry moods max, or group by metaphor; rest behind “More moods.” Chips need hierarchy (filled-world moods first), not alphabetical wall.  
- **In-world tags:** collapse to world-relevant tags only; don’t reprint TMDB’s whole vocabulary inside Documentary.

---

### P1 — Map territory readability + purple landmass

**What (screenshot + code):**  
- Territories use Tailwind-default-ish fills; **Constellation = indigo `rgba(99,102,241,0.12)`** — sits in the AI-purple family the brand bans.  
- Resting warps at `rgba(255,255,255,0.055)` — nearly invisible on carbon.  
- Focus lights gold warps + gold Enter — same fuel as Shell.  
- Focus strip: strong left copy, **empty right plane** — unfinished composition.  
- Territory labels: uppercase + wide tracking (eyebrow tell) at low contrast.

**Why it matters:** Map is the one object that could make Worlds unforgettable. Right now landmasses read as “tinted blobs,” purple constellation reads as AI default, and kinship is guesswork until hover.

**Fix direction (`/polish` + chroma retune, not cream):**  
- Retint territories from **ink-adjacent** hues already in world registers that aren’t violet: slate Reading Room (ok), rust/oxblood Threshold, olive Panel, warm umber Interior, teal Frontier — keep Constellation as **cold steel / bone-blue**, not indigo-500.  
- Resting warps: lift to ~0.12–0.16 white or mist; focus: **world-accent of focused node**, not global gold.  
- Fill the focus strip’s right void with a mini shelf heat (3 posters) or kill the strip height.  
- Territory labels: sentence case or small caps without tracking parade.

---

### P1 — Hero / reg-tick / ghost-numeral as costume

**What:** Same composition on hub and every world: reg-ticks panel + giant ghost count + eyebrow metaphor + huge H1. Documentary “32”, Horror “40”, hub “16”.

**Why it matters:** Recurring silhouette is good **once**. Repeated as the only hero idea, it becomes a template (AI tell: numbered certificate card). The number rarely teaches — unwatched count is also in Whisper and Timeline.

**Fix direction:** Keep reg-ticks as *rare* booth seal (tour desk or atlas header only). World entry hero should lead with **art or shelf**, not a watermark integer. If a numeral stays, make it mono, small, and semantically labeled (“32 unwatched”), not decorative 18rem mist.

---

### P1 — Type scale chaos

**What:** 60px Geist H1 vs 2xs meta vs chip sm vs map 11px uppercase vs shelf controls — no clear 5-step ladder. Display/sans/mono jobs trade places (ghost numeral asks for display but may inherit wrong; meta uses mist without mono for counts).

**Fix direction (`/typeset`):** Lock Instrument Ink scale — display (doors/H1), sans (prose/chips), mono (counts, eras, “3 titles”). One size per role. Stop using tracking-wide uppercase as fake hierarchy.

---

### P2 — AI / slop tells inventory (keep booth, cut tells)

| Tell | Where | Keep intent? |
|------|-------|--------------|
| Equal 3-col feature cards | Atlas | No — densify / break rhythm by filled vs empty |
| Pill / chip cloud | By mood, Archive, in-world Tagged | No — curate |
| Uppercase tracking eyebrows | Metaphor on doors, territory labels, TEMPO chrome | Cap: ≤1 per major section |
| Indigo/violet accents | Sci-fi, fantasy, noir, mystery, Constellation fill | Retint off purple family |
| Sparkles icon | Companion nav + panel | Replace with booth presence mark (brand already bans ✦/Sparkles as AI shorthand) |
| Middle-dot legend spam | Filled · N / Sparse · N repeated 2–3× | One legend per page |
| Em-dash / poetic microcopy | Hub sub (“rooms you can step into — …”) | Tone OK if dash hygiene matters elsewhere; visual issue is repetition not poetry |
| Glass sidebar blur | Shell | Acceptable booth lacquer — not the problem |

---

## Surface-by-surface notes

### `/genre` hub

- First viewport sells **chrome**, not **cinema**. Atlas doors below are the product; hero steals the fold.
- Status legend appears in hero **and** Map — duplicate ritual.
- Mood section after a long Atlas scroll feels like a second product. Either mood is the entry (bolder, fewer) or it’s a footnote.

### Documentary (Guided, live)

- Tour desk + Tonight shelf = good.  
- Below: Whisper + library + full Self steer chip row + Timeline warehouse = visual noise floor rises to “dashboard.”  
- Featured / argument / modules far down — art arrives after the eye is tired.  
- World accent slate on Documentary is appropriately hush; gold still over-frames.

### Horror (Guided, live)

- Threshold metaphor copy is strong; red Watchlist is genre-true.  
- Red primary + gold FAB + gold ticks = three “important” hotspots in one viewport.  
- Ghost “40” behind Horror is pure costume.  
- Dial option cards are the right density — three choices, readable. Model the rest of Worlds on that packing.

### Map

- Best craft on the page when focused (Documentary node + warps).  
- Unfocused: flat graph texture, purple constellation, hollow focus strip.  
- Do not hide Map behind weak disclosure on world pages if hub Map is the atlas — one canonical map, fully visible, packed.

---

## How density stays beautiful (principle)

1. **Pack by kinship, not by alphabet.** Mood chips and tags should cluster like the map territories.  
2. **Air is a spotlight.** One hero moment per viewport (tour shelf *or* map focus *or* filled door), not watermark + H1 + legend + FAB.  
3. **Asymmetry from data.** Filled Horror door should be visually heavier than Empty Romance — same component, different density.  
4. **One fuel color per job.** Gold = system/active; world-accent = in-world verbs; mist = chrome.  
5. **Type does the hush.** Cabinet for what you feel, Geist for what you do, mono for what you count — actually applied.

---

## Suggested command stack (when implementing later)

1. **`/typeset`** — fix `font-display` application; lock scale; mono for counts.  
2. **`/quieter`** — gold jobs only; mist reg-ticks; kill legend triple-repeat.  
3. **`/bolder`** — asymmetric Atlas density; art-led world hero; map focus strip filled.  
4. **`/distill`** — mood 36 → curated set; in-world tag row → relevant only.  
5. **`/polish`** — map chroma off indigo; warp contrast; focus strip composition.  
6. Final **`/polish`** pass on Guided viewport alone (desk + shelf + one accent).

---

## Design health (visual-only slice)

| Heuristic (visual lens) | Score 0–4 | Key issue |
|-------------------------|-----------|-----------|
| Aesthetic & minimalist design | 1 | Costume chrome + chip soup |
| Consistency & standards | 1 | Display font broken; gold vs world-accent |
| Recognition rather than recall | 2 | Map helps; legends repeat |
| Visibility of system status | 3 | Status dots work; over-signaled |
| Match real world (cinema booth) | 2 | Intent yes; execution SaaS-card |

**Visual subtotal feel:** ~9/20 — intent above execution.

---

## Out of scope for this roast

Interaction staging, Guided cognitive load, IA of Self vs Guided — covered by sibling roast agents. This doc only answers: **does it look like a finished Instrument Ink vault, or like unfinished AI booth cosplay?** Answer: the latter, fixable without abandoning the aesthetic.
