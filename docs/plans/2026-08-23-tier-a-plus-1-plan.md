# Tier A+1 — ToolTrace Evolution (tool-ui Patterns → HTMX, Style-Preserving)

## Completed

### Smooth Collapse Fix (1 hr) ✅ a4e565a
Eliminates the layout jump on ToolTrace collapse/expand by replacing
`AnimatePresence` mount/unmount with `max-height` transition. Rows stay in
DOM with `maxHeight: 0` when collapsed.

## Planned (6 items, ~12 hr remaining)

### Streaming Tool Cards (3 hr)
- `compare_titles` → side-by-side poster grid in ToolTrace row
- `get_title_details` → streaming poster + metadata card
- Server returns `html_fragment` in `tool_done` SSE event
- Cards reuse existing `ring-1 ring-white/10` / `h-24 rounded-lg object-cover` styling
- `ToolResultCard` component wraps ToolTrace rows

### Taste Feedback Loop (3 hr)
- `taste_feedback` table in schema
- Post-turn scan for negation patterns in user messages
- Extract genre/director/title → update taste profile weights
- No UI change to chat surface

### Rolling Summary (2 hr)
- When `stream.steps.length > 15`, auto-trigger `summarizeConversation()`
- Result prepended as `contextNote` (same position as "Recalled X titles")
- Invisible extension — same ContextNote component

### Nudge System (2 hr)
- Cron job (every 6h) evaluates library state → `proactive_nudge` row
- Nudges trigger existing `dormant` state in ChatThread
- Uses `SparkAvatar` memory pulse (`showMemoryPulse` prop)
- Same UI, new trigger

### Voice I/O (2 hr)
- Push-to-talk on FAB long-press
- Web Speech API + SpeechSynthesis
- Reuses existing `playCue` sound system
- No new UI components

### Forking + Visual Map (4 hr)
- Constellation metaphor using `MemoryConstellation`
- Fork points appear as constellation nodes
- Tap to switch branches

## Visual Language Preservation
All new components reuse existing styling:
- `ring-1 ring-white/10` → card borders
- `h-24 rounded-lg object-cover` → poster thumbnails
- `bg-gold-400/10` → accent backgrounds
- `EASE_OUT_EXPO` → all motion timings
- `text-mist-300` → secondary text

No component replacements — only extensions of `ToolTrace`, `WaveformSkeleton`,
`SparkAvatar`, `MemoryConstellation`, and the existing poster card styling.
