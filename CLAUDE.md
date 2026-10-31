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
    (daily notes, tips).
- **App icon — fixed 2026-10-31:** the configured PWA/favicon icon was leftover Vite
  template cruft (a sprite sheet of social icons that renders blank on its own) —
  that's why the app had no photo when installed. Replaced with a real icon (simple
  end-mill mark, public/icon.svg + generated PNG sizes). Isaac had to uninstall and
  reinstall the PWA on his phone to pick up the new icon.
- **IN PROGRESS, resume here — Mastercam PDF knowledge base (started 2026-10-31):**
  Goal: upload PDFs, extract + chunk + save the text, and have Wadsworth search that
  saved text to answer Mastercam questions grounded in the actual docs. Not real
  "training" — no model gets retrained, it's upload → extract → save → search →
  hand relevant chunks to Claude as context. Decided to start with plain Postgres
  full-text search (keyword-based, free, deterministic, no second API key) rather
  than semantic/embedding search (better fuzzy matching, but needs a separate
  embeddings API — can upgrade to this later if keyword search isn't finding the
  right stuff).
  - Step 1 (in progress, confirm done before continuing): Isaac creating a public
    Supabase Storage bucket named `mastercam-pdfs`, and running
    `mastercam_chunks_migration.sql` (saved in repo root) in the SQL Editor — creates
    a `mastercam_chunks` table with a generated `tsvector` column + GIN index for
    full-text search, RLS disabled (matches the rest of this app's tables).
  - Step 2 (not started): build a PDF upload tab — extract text client-side (need to
    add a PDF-parsing library, e.g. pdfjs-dist, not yet installed), chunk it, upload
    the original PDF to the `mastercam-pdfs` bucket, insert chunks into
    `mastercam_chunks`.
  - Step 3 (not started): update the `wadsworth-chat` Edge Function to run a
    full-text search against `mastercam_chunks` for the user's question and include
    the top matches as context before calling Claude.
  - Isaac doesn't have PDFs ready yet — building the pipeline now, he'll add real
    files once it works.
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
