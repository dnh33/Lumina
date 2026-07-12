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
