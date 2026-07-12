# Lumina — Domain Language (Critics Scores)

## Language

**Critics score**: an aggregated rating from an external source (IMDb, Rotten
Tomatoes, TMDb) describing the *work*, independent of any user.
_Avoid_: "rating" alone (ambiguous with the user's personal score).

**User score** (`library.rating`): the signed-in user's personal 1–10 verdict
on a title. Lives on `library`, never on `titles`.
_Avoid_: "my rating", "personal rating" used interchangeably with critics score.

**IMDb ID** (`titles.imdb_id`): the bridge key from TMDb `external_ids` to OMDb.
The only stable link between TMDb's catalog and OMDb's critic scores.

## Relationships

- A **Title** has exactly one set of **critics scores** (IMDb, RT, TMDb vote).
- A **Library entry** references one **Title** and carries the user's **user score**.
- **Critics scores** are sourced from OMDb, bridged via the Title's **IMDb ID**
  (which TMDb supplies through `external_ids`).

## Lumina's Take (companion read)

**Lumina's Take** (`TitleInsight`): the companion's personalized read of a single
title, returned as a structured payload — not prose alone.
_Avoid_: "the insight" used ambiguously for the chat feature.

**Verdict**: Lumina's scannable judgment on a title — `love` / `maybe` / `skip` /
`rewatch`. `rewatch` is forced when the title is already in the library with a
user score (a retrospective read, never "should you watch it?").
_Avoid_: treating verdict as a star rating.

**Comparison anchor** (`InsightComparison`): a title from the user's *own* library
that the take cites as a signal, linked by `relation` (`echoes` = their love
predicts love; `warns` = their low score/DNF signals risk; `diverges` = unlike
their usual). Always a real `tmdbId` from `retrieveLibrary`, never invented.

**Match score** (`matchScore`): 0–100 integer confidence that the title fits the
user's demonstrated taste. `null` when the profile is `empty`/`thin` (too little
signal to score honestly).

**Profile state** (`profileState`): `empty` (no library) / `thin` (some signal) /
`rich` (`(lovedTitles>0 || dislikedTitles>0) && ratedCount>=8`). Gates whether the
take shows comparisons + match score or a "log a few favorites" nudge.

**Follow-up** (`InsightFollowup`): a deterministic, server-generated chat deep-link
(label + prefill) so the take is never a dead end.
