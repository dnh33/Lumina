# Worlds adversarial interact QA — 2026-08-06

**Auditor:** live Chrome DevTools clicks only. Prior DoD / header / emil docs were not trusted.
**Worktree:** `.worktrees/immersive-curated-genre-specific-experie`
**Servers:** `:5173` / `:4000` already up (no restart).
**Viewport:** existing CDP Chrome session @ `127.0.0.1`.

## Overall

**MOSTLY TRUE** — after three surgical P0 fixes found by interaction. Without those fixes the honest answer was **NAH** (peer still navigated, Library ignored `?status=watchlist`, Self Pass wiped Featured).

**Daniel one-liner:** Agents were half-right on screenshots; real clicks exposed peer-nav + dead Library query + Pass killing Featured — fixed and re-proved.

---

## Claim scorecard

| # | Agent claim (paraphrased) | Verdict | Evidence |
|---|---------------------------|---------|----------|
| 1 | Hub Doors cards + Enter work | **CONFIRMED** | `/genre` → clicked Horror door card → `/genre/horror?decade=1970s`, Self pressed, tray + Featured painted |
| 2 | Hub Resume tour visible + works | **CONFIRMED** | Horror card showed `Resume tour` → click → `/genre/horror?mode=guided`, Guided pressed, claim fold |
| 3 | Hub Map / Mood / Archive tabs work | **CONFIRMED** | Clicked each: `?tab=map` territory map; `?tab=mood` eight mood links; `?tab=archive` 14 archive genre links |
| 4 | Self header numeral present | **CONFIRMED** | Horror Self: numeral `84` @ `2.5rem` / `text-mist-100/25`; H1 `Horror` |
| 5 | Decade tray works | **CONFIRMED** | Clicked `1990s` → `?decade=1990s` + tray; clicked `1980s` → tray (Thriller, Shining, Thing…) |
| 6 | Featured Watchlist / Pass | **PARTIAL → CONFIRMED after fix** | Watchlist on Ghosts → `In Library` + Open link. **Pass** on Thriller initially **wiped Featured** (see P0-A). After fix: Pass → Featured advanced to Come and See with actions intact |
| 7 | Open in Library when shown | **CONFIRMED** | Featured showed link `href=/library?status=watchlist` after Watchlist / when already in library |
| 8 | Mode flip Self → Guided | **CONFIRMED** | Clicked Guided → `/genre/horror?mode=guided`, claim UI |
| 9 | Guided dials tap/retune | **CONFIRMED** | Opened Tempo → picked `Tight coil` → whisper `Tempo → Tight coil. Tonight shelf reshuffled.` dial label updated |
| 10 | Shelf peer activate, no navigate | **FALSE → CONFIRMED after fix** | Pre-fix: click `The Thing 1982` → **navigated** to `/title/movie/1091`. Cause: hover/default-lead made `actionsOpen` true so first click took the “second tap opens” path. Fix: poster button activates only; Open owns navigate. Re-prove: click Exorcist peer → stayed on guided URL, actions moved to Exorcist |
| 11 | Watchlist ×2 bags titles | **CONFIRMED** | Watchlisted Exorcist then Thing → bag listed both (+ Rosemary); count `3 watchlisted` |
| 12 | Tonight bag → Library shows watchlist; `?status=watchlist` filters | **FALSE → CONFIRMED after fix** | Pre-fix: bag link landed `/library?status=watchlist` but **All** pressed, 17 titles incl. watched (Alien, Shining…). Fix: Library reads/writes `status` search param. Re-prove: Watchlist pressed; only watchlist ribbons; bag titles present; watched decade films gone |
| 13 | Deepen FAB open/close | **CONFIRMED** | Open → dialog `horror deepen companion`; Close → dialog gone, FAB collapsed |
| 14 | Shell “Archive chat” on genre route | **CONFIRMED** | On `/genre/horror*` nav label is `Archive chat` (not Companion) |
| 15 | Widen → Back to shelf → still Claim | **CONFIRMED** | Widen → `?decade=1970s&mode=guided` archive browse + `Back to shelf` → `/genre/horror?mode=guided`, `data-guided-stage=claim`, status `Guided. Claiming tonight's picks.` |
| 16 | Classic dial → recognizable seed shelf | **CONFIRMED** | Era dial `Classic`; shelf Thing / Rosemary’s Baby / The Exorcist |
| 17 | Header Guided quieter than Self | **CONFIRMED** | Self: H1 Horror `20px`, numeral `44px`. Guided: Horror demoted to `p` `14px`; numeral `36px` + lower opacity class; H1 is tour copy `The door is chosen` |

---

## P0 defects found live (fixed + re-verified)

### P0-A — Self Pass wiped Featured
- **Before:** Pass on Featured when only the lead had a hydrated thesis → next pick had no `args` → `showFeatured` false → `browse-inspect` collapsed (timeline alone).
- **Fix:** `GenreModules.tsx` synthesizes `fallbackThesisFromItem` when the successor lacks a lazy arg. Regression test added.
- **Re-verify:** Pass Thriller → Featured became Come and See with claim actions.

### P0-B — Guided peer poster navigated away
- **Before:** Click peer cell → `/title/movie/…`.
- **Fix:** `GuidedTour.tsx` poster `onClick` only `setShelfActiveKey`; Open button remains the navigate path. Test updated.
- **Re-verify:** Peer Exorcist activate stayed on guided URL.

### P0-C — Library ignored `?status=watchlist`
- **Before:** Deep link from bag left status tab on **All**.
- **Fix:** `Library.tsx` initializes + syncs from `useSearchParams`; tab changes update the query.
- **Re-verify:** `/library?status=watchlist` → Watchlist pressed, filtered list.

---

## Interaction log (abbreviated)

1. Hub Doors → Enter Horror → Self 1970s.
2. Hub → Resume Horror tour → Guided claim.
3. Hub Map → Mood → Archive (each click).
4. Self 2010s / 2020s / 1990s decade tabs; Featured Watchlist Ghosts; Pass Thriller (bug); re-Pass after fix.
5. Flip Guided; Tempo retune Tight coil; peer Thing (bug); peer Exorcist after fix; Watchlist×2; bag → Library (bug); Library after fix.
6. Deepen open/close; Widen; Back to shelf (claim); Classic seeds spot-check; Archive chat + header quieter metrics.

---

## Files touched this audit

- `client/src/components/genre/GenreModules.tsx` (+ test)
- `client/src/components/genre/GuidedTour.tsx` (+ test)
- `client/src/pages/Library.tsx`

No packing reopen. No git.
