<div align="center">

# ✦ Lumina

**Your private cinematic memory, and an AI companion that actually knows your taste.**

*Local-first film & TV archive · multi-layer RAG intelligence · cinematic dark UI*

</div>

---

Lumina turns your personal watch history into a living understanding of your taste. Log what you have seen, rate it, tag it, scribble notes. Then talk to an AI companion that retrieves your real history before every reply. It recommends with reasons ("you rated *Arrival* 10 and wrote 'quiet dread', this has the same nerve"), never spoils, never suggests what you have already seen, and remembers past conversations.

Everything lives in a single SQLite file on your machine. No accounts, no cloud sync, no tracking.

## Features

- **Complete personal archive**: movies and series with statuses (watched / watching / watchlist / abandoned), 1-10 ratings, favorites, free-form notes, personal taste tags, and per-episode tracking for TV with season progress.
- **Spoiler shield**: unwatched episode titles and stills are blurred until you watch them. Season premieres always stay visible. Toggleable from the tracker, remembered across sessions.
- **Conversational AI companion**: streaming chat grounded in your library via a 4-layer RAG pipeline, with live tools for reading *and writing* your data. It can save titles with your rating, append your reactions to notes, add taste tags, and check off episode progress ("mark season 1 watched"). Every write shows a visible receipt chip, so nothing changes silently.
- **AI extras**: spoiler-safe "Previously on" recaps built only from episodes you have watched, personal "Why would I love this?" insights on any title, ranked verdicts when you are torn between options, and an "anything new for me?" check across your running shows.
- **Search and discovery**: one omnibar for instant title search (keyboard-first, with posters and quick save) and mood matching handed to the AI. Rails for Up Next (exact next episode, one-tap mark watched), For You, Because You Loved, The Encore (old favorites worth a rewatch), ranked Trending, Popular and Acclaimed.
- **Rich title pages**: official title-logo artwork, trailer lightbox, Where to Watch with streaming provider logos for your region, cast rows that link to full person pages (biography, filmography, your history with them), next-episode countdown, and a "you vs the crowd" rating comparison.
- **Import and export**: bulk-import your history from CSV (auto-matched against TMDB), export everything as JSON anytime, plus automatic daily JSON snapshots (see Backups below).

## Quick start

Requirements: **Node.js 20.19+** (22 LTS recommended).

```bash
git clone https://github.com/dnh33/Lumina.git
cd Lumina
npm install

# configure keys
copy .env.example .env        # (macOS/Linux: cp .env.example .env)
# then open .env and fill in TMDB_ACCESS_TOKEN and OPENROUTER_API_KEY

npm run dev
```

Open **http://localhost:5173**. The API runs on port 4000; the web app proxies to it automatically.

### Production mode (single port)

```bash
npm run build
npm start          # serves the built app + API on http://localhost:4000
```

Set `HOST=0.0.0.0` in `.env` to open Lumina from your phone or tablet on the same network. Set `WATCH_REGION` (default `DK`) to control which country's streaming providers are shown.

## API keys (both free to obtain)

| Key | Where | Notes |
| --- | --- | --- |
| `TMDB_ACCESS_TOKEN` | [themoviedb.org → Settings → API](https://www.themoviedb.org/settings/api) | Use the long **API Read Access Token** (v4), not the short v3 key. Free. |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) | One key, any model. Pay per use. |
| `OPENROUTER_MODEL` | `.env` or Settings page | Default `anthropic/claude-sonnet-5`. Pick a model with solid tool-calling; the companion depends on it. |

## How the intelligence works

Lumina assembles fresh context for every single message, in four layers:

1. **Taste profile.** SQL aggregates over your whole library: genre affinities, loved and disliked titles, favorite directors, your own tag vocabulary, rating style, current progress, watchlist. Always present.
2. **Library retrieval.** FTS5 full-text search (BM25 blended with your ratings and favorites) over titles, synopses, genres, people, notes and tags.
3. **Conversation memory.** Relevant moments retrieved from past conversations.
4. **Live tools.** During the reply the model calls search_library, get_taste_profile, search_tmdb, get_title_details, discover_titles, add_to_library, update_library_entry, set_episode_progress, get_episode_progress, compare_titles, get_episode_recap and check_continuing_series, so titles are verified and current, never hallucinated.

Verified recommendations arrive with a hidden payload the UI renders as poster cards, each carrying a one-line reason tied to your history and a SAFE or STRETCH badge.

## Backups

Your library, ratings, notes, tags and every conversation live in `data/lumina.db`. The whole `data/` folder is **gitignored on purpose**: it is private, and it should never land in this repository.

Two safety nets:

1. **Automatic snapshots.** On boot, Lumina writes a daily JSON export of everything to `data/backups/` and keeps the last ten. You can also export manually anytime from Settings.
2. **Your own private backup repo.** If you want off-machine backups with history, put the `data/` folder in a *separate, private* GitHub repo. Because the main repo ignores `data/`, a nested repo there never conflicts:

```bash
# one-time setup: first create an EMPTY PRIVATE repo on GitHub, e.g. <you>/lumina-data
cd data
git init
git add .
git commit -m "library backup"
git branch -M main
git remote add origin https://github.com/<you>/lumina-data.git
git push -u origin main
```

Then whenever you want to back up (or drop it in a scheduled task):

```bash
git -C data add -A
git -C data commit -m "backup"
git -C data push
```

Make that repo **private**: it contains your notes and full AI conversation history. The JSON snapshots in `data/backups/` are plain text, so they diff nicely in git; the `.db` file itself is binary and versions less gracefully, but for a personal library the size is trivial either way.

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
Lumina/
├─ server/            Express 5 + better-sqlite3 API
│  └─ src/
│     ├─ db/          schema, versioned migrations, FTS5 index
│     ├─ tmdb/        bearer-auth client with SQLite response cache
│     ├─ services/    library, episodes, discovery, import/export
│     ├─ rag/         taste profile · retrieval · memory · context builder
│     ├─ llm/         OpenRouter client, persona, 12 tools, streaming chat
│     └─ routes/      REST + SSE endpoints
├─ client/            Vite + React 19 + Tailwind v4 + Framer Motion
│  └─ src/
│     ├─ pages/       Discover · Library · Title · Person · Companion · Settings
│     └─ components/  omnibar, posters, carousels, episode tracker, chat
└─ data/              lumina.db + backups/ (created on first run, gitignored)
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

The only things that ever leave your machine are TMDB metadata lookups and the chat context sent to your chosen model via OpenRouter. Your library database stays local, always.

## License

MIT © dnh33

---

*This product uses the TMDB API but is not endorsed or certified by TMDB.*
