# 0003 — Lumina's Take is a structured, retrieval-grounded payload

The original "take" was a single prose string (`{ text, cached, model }`)
grounded only in the aggregated taste profile. This broke the page layout
(unbounded prose) and never compared the user to their *own* closest titles.

Decision: Lumina's Take is now a structured `TitleInsight`
(`verdict`, `matchScore`, `comparisons[]`, `hook`, `followups[]`,
`profileState`). The server calls `retrieveLibrary()` to pass the user's
real semantic neighbors into the prompt, the LLM returns strict JSON
(`response_format: json_object`, tolerant-parsed), follow-ups are generated
**deterministically server-side** (not by the model), and the client renders
a reserved-height, scrollable card with verdict chip + comparison `Link`s +
chat deep-links.

Trade-offs considered and rejected:
- *Stream the take* — adds complexity, no user value yet (YAGNI).
- *Compare against external/catalog titles* — would need neighbor data we
  don't have; the user's own library is the meaningful anchor.
- *Let the LLM author follow-up chips* — unreliable deep-links; deterministic
  generation is safer.
- *Keep the take prose-only with client-side heuristics* — can't ground
  comparisons in real neighbors without the server doing retrieval.

Note on `profileState` "rich" threshold: code requires
`(lovedTitles.length > 0 || dislikedTitles.length > 0) && ratedCount >= 8`.
This is stricter than the original design text (which allowed "≥8 rated" alone);
the stricter form avoids flagging a profile "rich" on eight mediocre ratings
with no loved/disliked signal. The design doc was updated to match.
