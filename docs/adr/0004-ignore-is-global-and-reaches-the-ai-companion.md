# 0004 — "Ignore" is global and reaches the AI companion

Early ignore designs scoped it to the discovery feeds only (trending, popular,
for-you). That leaked: the catalog search bar, the `discover_titles`/`search_library`
LLM tools, the taste profile, and the "continuing series" nudge all still
surfaced ignored titles. The user's requirement was stricter — an ignored title
must be *completely* out of sight, including not searchable and not considered by
the LLM.

Decision: **ignore is a global, non-destructive hide-list.** It is stored in a
dedicated `ignored` table (`tmdb_id`, `media_type`, `added_at`, UNIQUE) — *not* a
nullable column on `library` and *not* a delete. Every surface that emits titles
filters through `ignoredTmdbIds(db)`:
- Catalog/TMDB results: via `flag()` → `filterCatalog()` (the prior build).
- LLM `discover_titles` tool: now routes results through `flag()` too.
- Library retrieval (`retrieveLibrary`) + taste profile (`computeTasteProfile`):
  skip entries whose `"mediaType:tmdbId"` is in the ignored set. This makes ignored
  titles vanish from the chat context, the insight "closest titles" neighbors, and
  the user's genre/director affinities.
- `upNext` (continuing-series nudge): excludes ignored "watching" entries.

Trade-offs worth recording:
- **Ignoring a library title removes it from the taste profile.** This is
  counter-intuitive (you'd think your watched/rated titles always count), but it
  is the deliberate reading of "not even an option the AI should consider." A user
  who ignores something is signalling it is not representative of their taste.
- **Non-destructive by design.** The `ignored` table is separate from `library`,
  so un-ignore (or "reset all") is instant and loses no data, and the companion can
  re-learn the title later. Rejected: a hard delete (loses history) and a
  `library.ignored` boolean (couples hiding to ownership — you can ignore a title
  you've never added).
- **The title you are actively viewing is exempt.** If the user opens the insight
  card for an ignored title, its take still generates — only the *neighbor*
  suggestions are filtered. Opening a title is an explicit "tell me about this,"
  distinct from passive discovery. (See CONTEXT.md, "Ignored title".)

Consequence: any *new* title-emitting surface must filter through `ignoredTmdbIds`
or it silently breaches the contract. Add the filter at the source, not in the UI.
