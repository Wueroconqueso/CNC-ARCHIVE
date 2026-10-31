# CLAUDE.md

Project-specific notes for CNC Archive. See also the global ~/.claude/CLAUDE.md for
cross-project context (Isaac's preferences, other projects).

## What it is
Isaac's personal CNC machining knowledge-base app. Simple for now; planned to grow more
complex over time.

## Stack
- React + Vite 5.4.0
- Supabase (database)
- Deployed on Vercel
- PWA — installed on Isaac's phone and desktop

## Status / backlog
- Next build: a G/M code reference tab — 2 fields per code (literal definition +
  plain-language applied example); later split into milling vs. turning sections.
- Future: edit/delete, auth, image attachments, export, an AI search layer.

## Known gotcha
- Supabase free tier pauses the project after 7 days idle. A cron ping to keep it
  awake is a future task, not yet implemented.
- **2026-10-31:** found the project paused (not deleted — data intact, 6 entries). Restored
  it via the Supabase Management API's `/v1/projects/{ref}/restore` endpoint using a
  temporary personal access token (created, used, then deleted same session).
- **FIXED 2026-10-31:** added `.github/workflows/keep-alive.yml` — pings the database
  every 3 days via GitHub Actions cron so it won't pause again. Tested live, works.
  Committed + pushed to main.

## Notes
(Add deeper technical notes, decisions, and gotchas here as they come up.)
