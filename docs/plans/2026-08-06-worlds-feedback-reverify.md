# Worlds feedback reverify — 2026-08-06

**Worktree:** `immersive-curated-genre-specific-experie`  
**Viewport:** 1440×900  
**Servers:** `:5173` / `:4000` (already up; not restarted)  
**Method:** agent-browser live + `/api/discover/genre-experience?genres=horror`

## Results

| # | Check | Verdict |
|---|--------|---------|
| 1 | Hub `/genre`: tabs Doors (default + WorldDoor cards) · Map · Mood · Archive; map not first | **PASS** |
| 2 | Horror header: big Cabinet numeral on RIGHT + particles/dust; Guided owns H1 | **PASS** |
| 3 | Title density: Horror rail ≫ ~40 (expect ~80+); decade not stuck at 8 | **PASS** |

## Evidence

### 1 — Hub IA
- URL `http://localhost:5173/genre`, viewport 1440×900.
- Tabs in order: **Doors** (selected) · Map · Mood · Archive (14).
- Panel copy: “Curated rooms - tone first, enter from the card.”
- WorldDoor grid present (Horror / Thriller / … with Enter →); `mapFirst=false`.
- Shot: `docs/plans/_feedback-reverify/01-hub.png`

### 2 — Horror Cabinet numeral + Guided H1
- URL `…/genre/horror?mode=guided&decade=2010s`
- H1 = **“The door is chosen”** (Guided owns it; world name is eyebrow “Horror”).
- Right-plane numeral **83**, Cabinet Grotesk (`font-display`), ~48px, `left≈1314` / viewport 1440 → right bias.
- Atmosphere: `HeroAtmosphere` grain/dust; HTML dust/mote/grain hits = 51; visible motes in header.
- Shot: `docs/plans/_feedback-reverify/02-horror-guided.png`

### 3 — Rail density
- API self horror: **TOTAL=84**; decades 1960s–2020s = 13/13/12/12/10/12/12 (cap 14/decade, limit 84).
- Live guided header: **83 titles**; self `?decade=2010s`: **84 titles** total, **2010s=12** (not stuck at 8).
- Shot: `docs/plans/_feedback-reverify/03-horror-self.png`

## Fixes this pass

None — all three already shipped.

## Blunt line for Daniel

All three landed: doors-first hub, right Cabinet 83 with dust, horror rail at 84 with decades at 10–13.
