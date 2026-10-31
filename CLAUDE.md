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

## Status / backlog (as of 2026-10-31 — building out into a bigger app, brick by brick)
- App restructured: collapsible left-sidebar nav (closed by default, opens via a ☰
  button top-left, closes on picking a tab). Tabs so far: Wadsworth (AI assistant),
  Home (daily note + tip of the day), Equations, Speed & Feed Calculator, G-Codes,
  M-Codes, Tapping (blank placeholder). Old multi-entry "Notes" journal removed from
  nav but code still exists, unused, at src/tabs/NotesTab.jsx.
- Milling-only focus for now (not turning), per Isaac's instruction.
- **Wadsworth (AI assistant) — built 2026-10-31:**
  - Real chat UI in src/tabs/WadsworthTab.jsx, calls a Supabase Edge Function
    (`wadsworth-chat`, deployed via the Supabase dashboard's browser code editor —
    Isaac doesn't have CLI access set up for this project, deploys by pasting code
    into the dashboard each time).
  - Edge Function code mirrored locally at
    supabase/functions/wadsworth-chat/index.ts for version control — keep this in
    sync manually when the deployed version changes, since there's no CLI link.
  - Anthropic API key stored as a Supabase Edge Function secret
    (`ANTHROPIC_API_KEY`), server-side only — never in the app's client code. Isaac
    created this key directly in Anthropic's console and pasted it straight into
    Supabase's secrets page, never into chat — correct, don't ask him to paste an
    LLM key into chat again.
  - Model: claude-sonnet-5-5. **Gotcha:** this model can return a "thinking" content
    block before the actual text block — grab the block where `type === "text"`,
    not `content[0]`, or replies come back empty.
  - Not yet done: giving Wadsworth a tool to search the app's own stored data
    (daily notes, tips) — that's the agreed next step. After that: a Mastercam PDF
    knowledge base (storage + indexing), once Isaac has PDFs ready to hand over.
- Tip of the Day: `tips` table, rotates by day-of-year, no cron/internet needed.
  Seeded with 10 general tips; Isaac has his own (messy) advice data he wants
  incorporated eventually — he'll send it when ready, not sent yet.
- Tapping tab: still blank, meant to have clickable sections (e.g. tap drill chart)
  later.
- Future: edit/delete, auth, image attachments, export.

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
