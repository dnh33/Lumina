# 0002 — OMDb is the critics source, bridged through TMDb `external_ids`

TMDb gives the richest metadata but no IMDb/Rotten Tomatoes scores. OMDb does,
keyed by IMDb ID. So: fetch TMDb details with `append_to_response=external_ids`
to get `imdb_id`, then call OMDb `?i=<imdbId>` to read IMDb (`imdbRating`, a
plain decimal like `"7.6"`) and Rotten Tomatoes (only in the `Ratings[]` array
as `"Rotten Tomatoes: 85%"` — the `tomatoes=true` param returns only `"N/A"`).

Decision: bridge TMDb → OMDb. Lazy-enrich on first `TitleDetail` open +
manual `POST /api/library/enrich-all` backfill. 30-day cache
(`ratings_fetched_at`). No key → scores silently absent (app fully functional
without critics).

Verified contract: `docs/plans/2026-07-12-critics-scores.md` + Aetherkeep
`06-projects/lumina/critics-api-contract.md`. Do not re-guess the OMDb shape —
IMDb is NOT `"x/10"`.

Trade-off: OMDb free tier is 1k req/day. Mitigated by title-level caching
(one fetch per work, not per view) and the backfill endpoint for bulk refresh.
