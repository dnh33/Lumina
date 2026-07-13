# 0005 — Filtering has two chokepoints, both keyed on `ignoredTmdbIds`

Titles flow through the system in two shapes: `CatalogItem` (TMDB-backed discovery
results) and `LibraryEntry` (the user's own library). They cannot share one filter
function because their fields differ (`tmdbId`+`mediaType` vs. a joined
`library`/`titles` row).

Decision: there are **two filter sites, one source of truth.**
- **Site 1 — `filterCatalog(db, items, {excludedGenres})`** inside `discoverService`,
  applied by `flag()`. Every TMDB discovery endpoint and the LLM `discover_titles`
  tool pass through it. This is the single chokepoint for `CatalogItem`s and handles
  both ignore and genre-exclude.
- **Site 2 — inline filters in `retrieveLibrary` and `computeTasteProfile`** that
  drop rows whose `"mediaType:tmdbId"` is in `ignoredTmdbIds(db)`.

Both sites read the **same** `ignoredTmdbIds(db)` `Set` — the single source of
truth for "is this hidden." Genre-exclude (`settings.excluded_genres`, stored as
TMDB genre IDs) is applied only at Site 1; the library layer does not filter by
genre because the user's own watched titles are never suppressed by taste — only
by an explicit ignore.

Trade-offs considered and rejected:
- *One unified filter over a common interface* — would require mapping every
  `LibraryEntry` to a `CatalogItem` (or vice-versa) just to filter; the inline
  key check is cheaper and keeps each layer's shape intact.
- *Genre-exclude also hiding library entries* — rejected; the user may love a
  genre generally but want it out of discovery. Genre-exclude is a discovery
  preference, ignore is a hard hide.

Consequence: when adding a new title source, reuse `ignoredTmdbIds` for the hide
check (don't re-query the `ignored` table by hand) and route `CatalogItem` results
through `flag()`.
