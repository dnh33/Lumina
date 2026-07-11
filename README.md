<div align="center">

# ✦ Lumina

**Your private cinematic memory — and an AI companion that actually knows your taste.**

*Local-first film & TV archive · multi-layer RAG intelligence · Forbes-level dark UI*

</div>

---

Lumina turns your personal watch history into a living understanding of your taste. Log what you've seen, rate it, scribble notes — then talk to an AI companion that retrieves your real history before every reply. It recommends with reasons ("you rated *Arrival* 10 and wrote 'quiet dread' — this has the same nerve"), never spoils, never suggests what you've already seen, and remembers past conversations.

Everything lives in a single SQLite file on your machine. No accounts, no cloud sync, no tracking.

## Features

- **Complete personal archive** — movies & series with statuses (watched / watching / watchlist / abandoned), 1–10 ratings, favorites, free-form notes, and per-episode tracking for TV with season progress.
- **Conversational AI companion** — streaming chat grounded in your library via a 4-layer RAG pipeline, with live tool access to your data and TMDB. Floating dock on every page, full-screen when you want depth.
- **Vibe & mood matching** — "cozy autumn mystery" in, calibrated suggestions out, rendered as poster cards.
- **Personal insights** — a "Why would I love this?" reflection on any title, written against your actual history.
- **Beautiful discovery** — trending hero, For-You rows built from your top genres, "Because you loved X", popular & acclaimed carousels. Everything excludes what you've already seen.
- **Import & export** — bulk-import your history from CSV (auto-matched against TMDB), export everything as JSON anytime.
- **Cinematic UI** — rich darks, film-grain texture, Fraunces serif display type, buttery motion, fully responsive from phone to desktop.

## Quick start

Requirements: **Node.js 20.19+** (22 LTS recommended).

```bash
git clone https://github.com/dnh33/lumina.git
cd lumina
npm install

# configure keys
copy .env.example .env        # (macOS/Linux: cp .env.example .env)
# → open .env and fill in TMDB_ACCESS_TOKEN and OPENROUTER_API_KEY

npm run dev
```

Open **http://localhost:5173**. The API runs on port 4000; the web app proxies to it automatically.

### Production mode (single port)

```bash
npm run build
npm start          # serves the built app + API on http://localhost:4000
```

Set `HOST=0.0.0.0` in `.env` to open Lumina from your phone or tablet on the same network.

## API keys (both free to obtain)

| Key | Where | Notes |
| --- | --- | --- |
| `TMDB_ACCESS_TOKEN` | [themoviedb.org → Settings → API](https://www.themoviedb.org/settings/api) | Use the long **API Read Access Token** (v4), not the short v3 key. Free. |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) | One key, any model. Pay-per-use. |
| `OPENROUTER_MODEL` | `.env` or Settings page | Default `anthropic/claude-sonnet-5`. Any OpenRouter slug works. |

## How the intelligence works

Lumina's RAG pipeline assembles fresh context for every single message:

```
┌─ Layer 1 · Taste profile ──────────────────────────────────────┐
│ SQL aggregates over your whole library: genre affinities,      │
│ loved & disliked titles, favorite directors, rating style,     │
│ current progress, watchlist. Always present.                   │
├─ Layer 2 · Library retrieval ──────────────────────────────────┤
│ FTS5 full-text search (BM25 + your-rating boost) over titles,  │
│ synopses, genres, people and your personal notes.              │
├─ Layer 3 · Conversation memory ────────────────────────────────┤
│ Relevant moments retrieved from past conversations.            │
├─ Layer 4 · Live tools ─────────────────────────────────────────┤
│ During the reply, the model calls search_library,              │
│ get_taste_profile, search_tmdb, get_title_details,             │
│ discover_titles, add_to_library, get_episode_progress —        │
│ so titles are verified and current, never hallucinated.        │
└────────────────────────────────────────────────────────────────┘
```

Verified recommendations arrive with a hidden `lumina-suggestions` payload that the UI renders as poster cards.

## CSV import format

`Settings → Import watch history`. Header row optional; only `title` is required.

```csv
title,year,type,rating,status,notes
Dune: Part Two,2024,movie,9,watched,"gorgeous slow-burn dread"
Succession,,tv,10,watched,razor dialogue
The Bear,,tv,,watching,
Blade Runner 2049,2017,movie,9,watched,
```

## Project structure

```
lumina/
├─ server/            Express 5 + better-sqlite3 API
│  └─ src/
│     ├─ db/          schema, migrations, FTS5 index
│     ├─ tmdb/        bearer-auth client with SQLite response cache
│     ├─ services/    library, episodes, discovery, import/export
│     ├─ rag/         taste profile · retrieval · memory · context builder
│     ├─ llm/         OpenRouter client, persona, tools, streaming chat
│     └─ routes/      REST + SSE endpoints
├─ client/            Vite + React 19 + Tailwind v4 + Framer Motion
│  └─ src/
│     ├─ pages/       Discover · Library · Title · Companion · Settings
│     └─ components/  posters, carousels, episode tracker, chat
└─ data/              lumina.db (created on first run, gitignored)
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API (4000) + web app (5173) with hot reload |
| `npm run build` | Type-checks and builds both workspaces |
| `npm start` | Production server on one port |
| `npm test` | Server unit tests (schema, RAG, normalizers) |
| `npm run typecheck` | Strict TS across both workspaces |

## Privacy

Your library, ratings, notes and every conversation live in `data/lumina.db` on your disk (gitignored). The only things that ever leave your machine are TMDB metadata lookups and the chat context sent to your chosen model via OpenRouter.

## License

MIT © dnh33

---

*This product uses the TMDB API but is not endorsed or certified by TMDB.*
