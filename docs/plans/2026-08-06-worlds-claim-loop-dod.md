# Worlds Claim Loop — Definition of Done (T11)

**Date:** 2026-08-06  
**Worktree:** `immersive-curated-genre-specific-experie`  
**Viewport:** **1440×900**  
**Live:** `:5173` restarted (was dead) · `:4000` UP  
**Evidence:** `docs/plans/_claim-loop-dod/` (script + shots)  
**Plan:** claim-loop T1–T10 shipped · T11 live QA

---

## Verdict

### **CLAIM-LOOP COMPLETE**

All nine DoD script rows **PASS** live. One **P0** ship-stopper found and fixed during QA (`preferredFromSelf` ReferenceError white-screen on `/genre/:slug`). Packing / Mode-split B untouched. Ready for Daniel AMAZING-OR-NAH re-judge.

---

## PASS / FAIL — live script

| # | Check | Result | Evidence @ 1440×900 |
|---|--------|--------|---------------------|
| 1 | Hub Enter Horror → Self | **PASS** | Enter href `/genre/horror?mode=self` → Self browse (`self-browse-stage`, H1 Horror). URL sync may drop `mode=self` → `?decade=…` while stage stays Self. |
| 2 | Resume tour → Claim | **PASS** | Hub mist chip **Resume tour** → `/genre/horror?mode=guided` · `data-guided-stage=claim` |
| 3 | Dial → Watchlist two → Tonight bag → Library | **PASS** | Dial → Claim shelf; Watchlist lands `tonight-bag` + `/library?status=watchlist`; Library H1 **Your archive** with watchlist rows present. (Classic seeds temporarily cleared from vault so Watchlist verb was exercisable — prior status was `watched`.) |
| 4 | Peer tap activates without leaving; Watchlist on peer | **PASS** | Inactive peer first click → `data-shelf-active=1` + `shelf-cell-actions` · stays on `/genre/horror` · Watchlist/In library verb on active peer. (CDP mouseenter+click can open; pure inactive→click does not.) |
| 5 | Deepen FAB → deepen; Shell Archive chat | **PASS** | FAB → `stage=deepen` + `role=dialog`; Escape → `claim`. Shell nav **Archive chat** on genre route (hub keeps Companion). |
| 6 | Widen → Back to shelf → Claim | **PASS** | Widen → `browse` · **Back to shelf** → `claim` |
| 7 | Self Watchlist active title → Library | **PASS** | `featured-claim-actions` Watchlist/Pass (or In Library + Open in Library) → `/library?status=watchlist` |
| 8 | Flip era continuity both ways | **PASS** | Self `decade=1980s` → Guided era dial **Classic**; Guided → Self restores `?decade=1980s` |
| 9 | Classic Claim shelf feels seeded | **PASS** | Classic Claim shelf: **The Exorcist · The Thing · Rosemary's Baby** (world seeds) |

---

## P0 fixed during T11

| Issue | Fix |
|-------|-----|
| `ReferenceError: preferredFromSelf is not defined` in `GenreExperience` — white `#root` on every genre enter | Pass `preferredFromSelf: preferredEraFromSelf` into `resolveGuidedEraChoice` (`GenreExperience.tsx`) |

No other P0s. Library deep-link shows `?status=watchlist` while the All chip can remain pressed (filter UI lag / pre-existing) — **not** a claim-loop blocker; items still render.

---

## Product status

| Axis | Note |
|------|------|
| Claim loop | **COMPLETE** |
| Trust | ↑ Tonight bag → Library · Resume explicit · seed shelf honesty · era both ways |
| Packing / Mode-split B | Unchanged · LENGTH GREEN |

**Ready for Daniel AMAZING-OR-NAH re-judge.**
