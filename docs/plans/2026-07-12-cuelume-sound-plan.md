# Cuelume Sound Integration Plan

**Date:** 2026-07-12 · **Status:** Plan only — no code in this pass
**Library:** `cuelume` (installed, verified from `node_modules/cuelume` source) — dependency-free, synthesizes 10 cues live via Web Audio. No audio files.

## Design stance

Lumina is a calm, dark, private space. Gold is rare on screen; sound must be rarer.
Sound marks **moments that matter** — a title saved, the companion waking, a turn finishing — not clicks for their own sake. The rule applied throughout:

1. **Reward, don't narrate.** Sound plays on *outcomes* (saved, done, matched) and a small set of *state flips* (nav, toggles). Never on navigation-by-link, never on destructive actions, never on errors (the visual FaultLine and red text carry those — a sad noise would be a gimmick).
2. **One sound per gesture.** No element gets hover + press + release + toggle stacked. Hover sound exists in exactly one place in the whole app.
3. **Silence is the default.** If an element isn't in the coverage matrix, it stays silent. Resist future drift.

---

## 1. Cue reference

| Cue | Character (verified from `dist/sounds/recipes.js`) | Lumina usage |
|---|---|---|
| `chime` | Soft 2-note ascending sine bell (~1046→1568 Hz), gentle shimmer tail | Gentle completion: assistant message finished, model setting saved |
| `sparkle` | Bright 4-note ascending twinkle (1760→3520 Hz) | Delight, used ONCE: the "Ask Lumina for a mood match" hand-off |
| `droplet` | Single sine glide 1200→550 Hz, water drop | "Something new arrived": fresh conversation created |
| `bloom` | Warm slow-swelling detuned-sine pad (528 Hz) | The companion waking: turn enters *thinking* |
| `whisper` | Quietest cue — lowpass noise swell, no tone | The one hover sound: the chat launcher star |
| `tick` | Crisp bandpass noise + 2600 Hz ping, instant | Selection: nav, rating dial, episode checkmarks, filters, send acknowledgment |
| `press` | Dull 1700 Hz knock (key bottoming out) | Mouse-only garnish on the send button (pointerdown) |
| `release` | Springy 4600 Hz + 3200 Hz ping (key return) | Mouse-only garnish on the send button (pointerup) |
| `toggle` | 2-part click-clack (2200→3800 Hz) | Binary state flips: dock open/close, favorite, status pills, spoiler shield, the sound setting itself |
| `success` | Warm 3-note ascending (880→1318 Hz), not a fanfare | Library writes: title saved, episode-season marked, CSV import done, write receipts |

**Semantic spine:** `tick` = "I selected", `toggle` = "I flipped a state", `success` = "the library changed", `chime` = "a soft moment closed", `bloom`/`droplet`/`sparkle`/`whisper` = companion presence. `press`/`release` are texture, not information.

---

## 2. Integration architecture

### 2.1 New module: `client/src/lib/sound.ts`

Single owner of the Cuelume surface. Nothing else imports `cuelume` directly.

```ts
import { bind, play, setEnabled, sounds, type SoundName } from "cuelume";
```

Responsibilities:

- **`initSound()`** — called once at app mount. Calls `bind()` (document-level delegation; `bind()` is idempotent per root and resolves `data-cuelume-*` at event time, so dynamically mounted React trees need no rescan). Reads the stored preference and applies `setEnabled()`.
- **Preference storage** — localStorage key **`lumina:sound`** in `client/src/lib/keys.ts` alongside `DOCK_CONVERSATION_KEY` / `SPOILER_SHIELD_KEY` (same `"1"`/`"0"` convention as the spoiler shield, default ON when absent — mirrors `loadShield()` in `EpisodeTracker.tsx:13`).
- **Mute resolution** — Cuelume's `setEnabled` is a module global with no persistence and no `prefers-reduced-motion` awareness. The app owns the policy:

  ```
  effective = userPref && !prefersReducedMotion
  setEnabled(effective)
  ```

  Reduced motion is read via `window.matchMedia("(prefers-reduced-motion: reduce)")` with a change listener (module-level, not per-component — `setEnabled` is global, so the sync must be too). This matches the app's existing `<MotionConfig reducedMotion="user">` root (`App.tsx:17`): a user who asked the OS for stillness gets silence, no exceptions.
- **`useSound(): { enabled, setEnabled }`** — React hook over the preference (state + localStorage write + `setEnabled` re-resolution). Consumed by the Settings switch. A tiny module-level subscriber list (or `useSyncExternalStore`) keeps multiple consumers honest; no context provider needed for one global boolean.
- **`playCue(name: SoundName)`** — thin wrapper over `play()`. All imperative call sites use this, never raw `play`, so future policy (per-cue throttling, debug logging) has one choke point. `play()` is already SSR-safe and no-ops when muted or given an unknown name; the wrapper adds nothing today beyond the seam.

Wiring: one `useEffect(() => initSound(), [])` in `App.tsx` (or an inline call guarded for idempotence — `bind()` already is). No provider component, no re-render coupling.

### 2.2 Settings toggle

`client/src/pages/Settings.tsx` — add an **"Interface sounds"** row. Placement: a small "Appearance & feel" block between the *Connections* and *What the AI knows about you* sections (or appended to Connections — implementer's call, keep it one switch, not a section of its own). Pattern:

- Switch reads/writes via `useSound()`.
- On flip **to ON**, imperatively `playCue("toggle")` — instant audible confirmation the setting works. On flip to OFF, nothing plays (already muted) — which is itself the confirmation.
- Copy stays in brand voice, e.g. label "Interface sounds", detail "Quiet synthesized cues for saves and the companion. Respects your system's reduced-motion setting." No emoji.

### 2.3 Declarative vs imperative — the split

**Declarative (`data-cuelume-*` attributes)** for elements where the DOM gesture *is* the event: nav links, toggles, dials, the send button's press texture. Zero React wiring; delegation handles clones and re-renders.

**Imperative (`playCue()`)** for outcomes the DOM can't see: mutation `onSuccess`, SSE stream phases, conversation creation. These fire from callbacks in `useChat.ts`, mutation handlers, and `submit()`-style functions.

**Critical input caveat (verified in source):** `data-cuelume-hover/press/release` fire only for `pointerType === "mouse"` under `(hover:hover) and (pointer:fine)`. Touch and keyboard users hear **nothing** from those three. Only `data-cuelume-toggle` (click) and imperative `play()` are cross-input. See §4 for the rule this forces.

---

## 3. Coverage matrix

Legend — *Mech*: `attr` = declarative attribute, `imp` = imperative `playCue()`. *Inputs*: M = mouse, T = touch, K = keyboard.

### App shell — `client/src/components/Shell.tsx`

| Element | Cue | Interaction | Mech | Inputs |
|---|---|---|---|---|
| Desktop sidebar `NavLink`s (Discover / Library / Companion / Settings), `Shell.tsx:38` | `tick` | click | `data-cuelume-toggle="tick"` | M T K |
| Mobile bottom-nav `NavLink`s, `Shell.tsx:70` | `tick` | click | same attribute (shared `NAV` map — add once per rendering) | M T K |

Logo, footer text: silent. Page-route transitions themselves: silent (the nav tick already marked the intent).

### Companion — declarative

| Element | Cue | Interaction | Mech | Inputs |
|---|---|---|---|---|
| Chat launcher star button, `ChatDock.tsx:131` | `whisper` | hover | `data-cuelume-hover="whisper"` — **the only hover sound in the app** | M only (accepted: pure garnish) |
| Chat launcher star button (open/close flip) | `toggle` | click | `data-cuelume-toggle` (default) | M T K |
| Composer send/stop button, `ChatThread.tsx:541` | `press` + `release` | pointerdown/up | `data-cuelume-press` + `data-cuelume-release` (defaults) | M only — texture; the real cross-input signal is the send `tick` below |

Dock header buttons (new conversation / maximize / close, `ChatDock.tsx:85-117`): no attribute — new-conversation feedback arrives as the imperative `droplet` on creation; maximize/close are silent.

### Companion — imperative (state-driven, in `useChat.ts` / `ChatDock.tsx` / `ChatPage.tsx`)

| Moment | Cue | Where | Inputs |
|---|---|---|---|
| Message submitted (all entry points: composer Enter/click, suggestion chips `ChatThread.tsx:413`, `SuggestionCards` posters `ChatThread.tsx:404`, omnibar prefill) | `tick` | Top of `send()` in `useChat.ts:120`, after the empty/in-flight guard — one call covers every entry point | M T K |
| Turn enters *thinking* (companion wakes) | `bloom` | On the `context` SSE event in the `streamChat` callback (`useChat.ts:180`), i.e. alongside `companionEventForSse("context")` — once per turn | n/a (state) |
| Tool phase begins | `tick` | On the **first** `tool` event of a turn only (`stream.steps.length === 0` check) — per-tool sound would chatter; the ToolRibbon/ReasoningInterstitial carry the detail visually | n/a |
| Library write receipt (`tool_done` with `WRITE_TOOLS` member, `useChat.ts:218`) | `success` | Same branch that sets `wroteToLibrary` — the AI changed your archive; this is the one mid-turn cue that earns `success` | n/a |
| Assistant turn completes cleanly (`done` event) | `chime` | Where `completed = true` is set (`useChat.ts:185`) — soft close, not a fanfare; skipped on abort/error paths | n/a |
| New conversation created | `droplet` | `api.createConversation()` success sites: dock header button (`ChatDock.tsx:89`), auto-create inside `send()` (`useChat.ts:151`), "Start fresh" (`ChatThread.tsx:337`). Cleanest: one helper or call it in `handleConversationChange`-adjacent success paths | M T K |
| Stream error / stop | — | **Silent.** Error UI + FaultLine avatar state carry it; stop is the user's own hand | |

`ChatPage.tsx` conversation list (select/rename/delete): silent — selection is navigation, rename/delete are housekeeping.

### Discover & search

| Element | Cue | Interaction | Mech | Inputs |
|---|---|---|---|---|
| PosterCard quick-save success, `PosterCard.tsx:45` (`add.onSuccess`) | `success` | mutation success | imp | M T K |
| Omnibar "Ask Lumina for a mood match", `SearchOmnibar.tsx:232` and its Enter-key path (`askLumina`, line 61) | `sparkle` | activation | imp inside `askLumina()` (covers click AND keyboard) | M T K |

Poster hover, carousel arrows, omnibar result rows, search commit, clear button: **silent** (dense, navigational, or both). PosterCard save *failure*: silent — red icon speaks.

### Title detail — `client/src/pages/TitleDetail.tsx`, `client/src/components/Bits.tsx`

| Element | Cue | Interaction | Mech | Inputs |
|---|---|---|---|---|
| ActionBar add mutations success ("I've watched this" / "Save to watchlist" / "Currently watching"), `TitleDetail.tsx:447` `add.onSuccess` → `done()` | `success` | mutation success | imp in `done()` (add path only — see note) | M T K |
| Status pills (watched/watching/watchlist/abandoned), `TitleDetail.tsx:527` | `toggle` | click | `data-cuelume-toggle` | M T K |
| RatingDial buttons 1–10, `Bits.tsx:78` | `tick` | click | `data-cuelume-toggle="tick"` | M T K |
| Favorite heart, `TitleDetail.tsx:553` | `toggle` | click | `data-cuelume-toggle` | M T K |

Note on `done()`: it's shared by add/update/remove. Only the **add** path gets `success` (first save is the moment); status/rating/favorite updates already tick/toggle at the gesture, and remove stays silent. Wire the cue into `add`'s own `onSuccess`, not the shared helper.

Trailer, back button, tags editor, notes autosave ("Saved ✦"), insight/recap requests, remove: **silent**. (Tags/notes are contemplative writing surfaces; sound would intrude.)

### Episode tracker — `client/src/components/EpisodeTracker.tsx`

| Element | Cue | Interaction | Mech | Inputs |
|---|---|---|---|---|
| Per-episode watched checkmark (buttons calling `toggleEpisode.mutate`) | `tick` | click | `data-cuelume-toggle="tick"` — crisp and quiet enough to survive binge-marking 10 in a row | M T K |
| Season "mark all watched" (`toggleSeason`) success | `success` | mutation success | imp in `onSettled`/success path (a season is a real archive change) | M T K |
| Spoiler shield toggle (`toggleShield`, line 68) | `toggle` | click | `data-cuelume-toggle` | M T K |

Season accordion expand: silent.

### Library page & AddModal

| Element | Cue | Interaction | Mech | Inputs |
|---|---|---|---|---|
| Filter pills (film/series/favorites/status tabs), `Library.tsx:154-185` | `tick` | click | `data-cuelume-toggle="tick"` | M T K |
| AddModal ResultRow "Watched"/"Watchlist" success, `AddModal.tsx:26` `add.onSuccess` | `success` | mutation success | imp | M T K |

"Add title" button (opens modal), retry buttons, modal open/close: silent.

### Settings — `client/src/pages/Settings.tsx`

| Element | Cue | Interaction | Mech | Inputs |
|---|---|---|---|---|
| New "Interface sounds" switch → ON | `toggle` | flip | imp (see §2.2) | M T K |
| Save model success, `saveModel.onSuccess` (line 54) | `chime` | mutation success | imp | M T K |
| CSV import success, `importCsv.onSuccess` (line 81) | `success` | mutation success | imp | M T K |

Export link, wipe conversations, retry buttons: silent (export is a download, wipe is destructive).

**Totals: 4 declarative cue kinds on ~8 element groups, 12 imperative moments. Everything else in the app is silent by design.**

---

## 4. Touch & keyboard strategy — one rule

> **Every sound that carries meaning fires on `click` (via `data-cuelume-toggle`) or from application code (`playCue` in handlers/mutation callbacks). `hover`, `press`, and `release` are used only as mouse-only *texture* on exactly two controls (chat launcher hover, send button press/release), where losing them loses nothing.**

Consequences:

- Touch and keyboard users hear the complete meaningful soundscape: nav ticks, toggles, saves, companion cues — because `click` fires for taps and Enter/Space on buttons, and imperative cues are input-agnostic.
- No custom keydown handlers for sound anywhere. If a control needs a keyboard-specific sound handler, that's a sign the cue is on the wrong trigger — move it to click/outcome instead.
- The web-audio autoplay gate resolves naturally: Cuelume lazily creates/resumes its shared `AudioContext` on the first user gesture, and every meaningful cue here *is* a user gesture or follows one.

---

## 5. Brand & restraint guidance

- **Sound never competes with gold.** The moments that get `success`/`sparkle` are the same moments the UI already spends gold (save badge, receipts, mood-match row). Sound reinforces the existing accent hierarchy; it never marks a moment the visuals treat as quiet.
- **Reduced motion = silence.** Non-negotiable, enforced in `sound.ts` at the module level (§2.1), not per-callsite. Cuelume has no built-in support for this — the app layer is the only place it can live.
- **No error sounds, no destructive-action sounds.** Errors keep their dignified visual treatment (FaultLine, red text). Deletes are silent.
- **Volume/character:** use the recipes as shipped — they're tuned quiet (master gain ~0.55, whisper near-inaudible). Do not layer, sequence, or re-pitch cues.
- **Frequency budget:** in a normal browsing session a user should hear a sound every handful of interactions, not every one. If a future element feels like it wants sound, it must displace something in the matrix, not extend it.

---

## 6. Implementation phasing

**Wave A — Foundation (no audible change beyond enablement).**
`client/src/lib/sound.ts` (init, preference, reduced-motion sync, `useSound`, `playCue`); key added to `lib/keys.ts`; `initSound()` in `App.tsx`; "Interface sounds" switch in `Settings.tsx`. Unit-testable: preference persistence, mute resolution truth table (pref × reduced-motion).

**Wave B — Declarative layer.**
Attributes per matrix: Shell nav (×2 renderings), ChatDock launcher (hover + toggle), send button (press/release), status pills, RatingDial, favorite heart, episode checkmarks, spoiler shield, Library filter pills.

**Wave C — Imperative layer.**
Companion stream cues in `useChat.ts` (send tick, bloom, first-tool tick, write-receipt success, done chime), conversation-created droplet, `askLumina` sparkle, mutation-success cues (PosterCard, ActionBar add, AddModal, season toggle, Settings save-model/CSV).

**Wave D — QA pass.** Checklist in §7. Also verify no double-sounds where declarative and imperative could overlap (e.g. send button has press/release attrs AND `send()` plays tick — that's press+release+tick on one mouse gesture; acceptable as designed since press/release are texture, but listen and cut press/release if it reads busy).

---

## 7. Verification

For every code wave:

```
npm run typecheck --workspace client   # must stay clean
npm run build --workspace client       # must pass
```

Manual checklist (Wave D):

- [ ] Mouse: launcher hover whispers (throttled, no re-fire from child re-enter); send button knocks down/up; nav/dial/toggles tick and clack.
- [ ] Touch (device or DevTools touch emulation — remember `(pointer:fine)` gate): NO hover/press/release sounds; taps on nav, toggles, saves, and companion flows all sound via click/imperative paths.
- [ ] Keyboard: Tab + Enter/Space on nav links, pills, dial, episode toggles, send — same sounds as tap.
- [ ] Companion turn end-to-end: tick (send) → bloom (thinking) → tick (first tool) → success (write receipt, if any) → chime (done). Stop and error paths stay silent.
- [ ] OS reduced-motion ON → total silence regardless of the Settings switch; toggling reduced-motion off restores per preference without reload.
- [ ] Settings switch OFF → total silence, persists across reload; ON plays a confirming toggle.
- [ ] First interaction after a cold load produces sound (AudioContext resume works — no console warning about autoplay).
- [ ] No double-sounds on: suggestion cards/chips (send tick must fire once), season mark-all (success once, not per-episode), PosterCard save (success once).
- [ ] `sounds` export sanity: every cue name used in code exists in Cuelume's `sounds` list (cheap unit test guards against typos, since `play()` silently no-ops on unknown names).
