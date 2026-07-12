# 0001 — Critics scores live on `titles`, not `library`

Critics scores (IMDb, Rotten Tomatoes, TMDb) describe the *work*, not the
user's relationship to it. Storing them on `library.rating` would conflate the
crowd's verdict with the user's personal 1–10 score.

Decision: add `imdb_id`, `imdb_rating`, `rt_rating`, `ratings_fetched_at` to the
`titles` table (v4 migration). `library.rating` stays the user's personal score
only. Client surfaces the user's score as the hero and critics as a subordinate
cluster (`CriticsCluster`).

Trade-off considered: storing per-library-entry would let a user override a
critic score per entry. Rejected — adds write paths and a second source of
truth for the same external fact. Title-level is correct because the work's
score is singular.
