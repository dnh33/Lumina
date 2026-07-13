# Context

Project-specific domain language for Lumina. General programming terms are
omitted. Terms are resolved as the codebase grows; see `docs/adr/` for the
decisions behind them.

## Language

**Ignore (verb) / Ignored title (noun)**: the user's explicit signal to hide a
work everywhere — not searchable, not in any discovery feed, and not an option
the AI companion may surface or reason about. Stored non-destructively in the
`ignored` table keyed by `(tmdb_id, media_type)`. Reversible via un-ignore /
"reset all ignored".
_Avoid_: "hide", "block", "mute", "exclude" (those mean different things — see
**Genre-exclude**).

**Genre-exclude**: a discovery *preference* — TMDB genre IDs the user does not
want recommended. Applied only to TMDB discovery results (catalog/for-you), never
to the user's own library. Stored in `settings.excluded_genres` as IDs (not names,
so it survives TMDB label drift).
_Avoid_: "ignore genre", "hide genre" (genre-exclude is soft and discovery-only;
ignore is a hard hide).

**Discovery feed**: any TMDB-backed, suggestion-style result set (trending,
popular, top-rated, for-you, because-you-loved, person credits, similar, and the
LLM `discover_titles` tool output). All route through `filterCatalog` → `flag()`.

**Taste profile**: the aggregated summary of the user's taste, computed from
their **library** (`computeTasteProfile`). Drives the system prompt, the insight
"closest titles" neighbors, and `compare_titles`. **Ignored library titles are
excluded** from this profile — ignoring a title removes it from the user's stated
taste.
_Avoid_: "preferences" (that's `settings`; the profile is *derived*, not set).

**Chat context / grounding**: the retrieval layers (`computeTasteProfile`,
`retrieveLibrary`, `retrieveMemory`) injected into the companion's system prompt
each turn. Ignored titles are filtered out here, so the model never grounds on
them.

**CatalogItem**: a TMDB discovery result (has `tmdbId` + `mediaType`). The shape
`filterCatalog` operates on.
_Avoid_: conflating with **LibraryEntry** (a joined `library`/`titles` row — the
user owns it). The two require separate filter sites (ADR-0005).

**Anchor (comparison anchor)**: a specific library title the companion cites as a
"like X" reference when framing a recommendation or insight (e.g. "if you
loved LOTR…"). Distinct from the *title being recommended* — fatigue is about
repetition of the **anchor**, not the title.

**Anchor usage log** (`anchor_usage`): the append-only record of every time a
title is cited as an anchor, keyed by `(tmdb_id, media_type, surface)`.
The source of truth for the fatigue score. Surfaces that log: `compare_titles`,
insight *neighbors*, and `take` (opening a title's own insight card — logs
only the opened title, fixed in commit `fff38ba`; before that it logged all
loved titles and caused the fatigue storm).

**Fatigue score**: a deterministic, recency-weighted value per title
(`fatigueScores`) = Σexp(-age_days/7) ÷ citation_count. Range 0–1;
≥ 0.6 marks a title "over-used" (drives the silent diversify directive +
the passive "Over-used" card hint). It measures how weighted *a title's own*
citations are, not its dominance vs other titles. Has a **hard 14-day window**
(citations older than `FATIGUE_WINDOW_DAYS` are dropped) and a **minimum-citation
floor of 3** (`MIN_CITATIONS`) — a title with fewer than 3 recent citations is
never flagged "over-used," so a single fresh citation can't read as fatigue.

**Retire-as-anchor**: the manual override — keep a loved title in the taste
profile but stop it being used as a comparison anchor. Stored non-destructively
as `library.anchor_retired` (independent of Ignore). One-tap on the library
card; reversible. _Avoid_: conflating with **Ignore** (ignore removes the title
from the profile entirely; retire keeps it).

**Hover bubble menu**: the poster-card quick-action menu (Watched / Watchlist /
Ignore / Retire-as-anchor) that slides up after ~2s hover (tap-to-open on
touch). The entry point for the Ignore and Retire actions on library cards.

## Relationships

- An **Ignored title** is hidden from every **Discovery feed**, from **search**, and
  from the **Taste profile** + **Chat context** (so the AI companion cannot surface
  or reason about it).
- **Genre-exclude** narrows **Discovery feeds** only; it does not touch the
  **Library** or the **Taste profile**.
- An **Ignored title** may still be in the **Library** (the two are independent —
  you can ignore a title you've never added, or ignore one you've watched).
- A **Retire-as-anchor** title stays in the **Taste profile** (it is still
  loved) but is excluded from being cited as a **Anchor** by `compare_titles`
  and insight *neighbors*. Independent of **Ignore** (which removes it from
  the profile entirely).
- An **Anchor** citation is recorded in the **Anchor usage log**; the
  **Fatigue score** is derived from that log and drives the silent diversify
  directive + the passive "Over-used" hint.
- **Genre-exclude** narrows **Discovery feeds**; **Retire-as-anchor** narrows
  *framing* of titles already in discovery. The two compose by stage and never
  overlap.

## Open ambiguities

- "Ignore" currently also suppresses the targeted **Taste profile** contribution of
  that title. If a user ignores a title they *loved*, their profile quietly loses
  that signal. This is the intended reading of "not even an option the AI considers,"
  but it is worth confirming with the user if they expect ignored titles to keep
  informing their taste.
