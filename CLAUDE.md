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
  - Step 1 (DONE): `mastercam-pdfs` public Storage bucket created, `mastercam_chunks`
    table created (tsvector + GIN index for full-text search, RLS disabled) via
    `mastercam_chunks_migration.sql`. Verified both exist (empty REST query returned
    200/[]).
  - Step 2 (DONE, code pushed, but BLOCKED on a missed SQL step — see below): built
    src/tabs/MastercamTab.jsx — upload a PDF, extract text client-side (pdfjs-dist,
    dynamically imported so its ~2MB doesn't bloat every page load), chunk it
    (~1500 chars, break on paragraph/sentence boundaries), upload original to the
    bucket, insert chunks into `mastercam_chunks`. Has a document list with chunk
    counts + remove button.
  - **Tested with Playwright before asking Isaac to touch it** (set up a local
    automated browser test — dev server + playwright, installed locally with
    `--no-save`, not committed; test script at
    cnc-archive/test_mastercam_upload.mjs, also not committed, uses a throwaway
    synthetic test PDF generated via Python reportlab, NOT any of Isaac's real
    personal PDFs). **Caught a real bug before Isaac saw it:**
    - Storage uploads failed with "new row violates row-level security policy".
      Gotcha: a Storage bucket's "Public" toggle only covers *reading* files —
      writes still need their own RLS policy on `storage.objects`, scoped by
      `bucket_id`. Fix SQL saved at storage_policy_migration.sql (adds
      select/insert/delete policies scoped to just `mastercam-pdfs`, doesn't touch
      other buckets like Relicwise's `relicwise-videos`). **Isaac needs to run this
      — not yet confirmed done.**
    - Also surfaced in the same test: the `tips` table genuinely does not exist
      (confirmed via direct REST call, 404) — the migration from the Tip of the Day
      build earlier got missed somehow, despite being given at the time. It fails
      silently in the UI (no tip shows, no visible error). Re-sent
      `tips_migration.sql` contents to Isaac. **Also not yet confirmed done.**
    - **Next action when resuming:** confirm both SQL pastes are done, then rerun
      `node test_mastercam_upload.mjs` (needs `npm run dev` running first) to verify
      the fix before bothering Isaac again.
  - Step 3 (not started): update the `wadsworth-chat` Edge Function to run a
    full-text search against `mastercam_chunks` for the user's question and include
    the top matches as context before calling Claude.
  - **Real PDF ingestion underway (started 2026-10-31):** Isaac's workflow is to
    paste/attach PDFs into the Claude Code chat **one at a time**, and only wants a
    receipt confirmation ("got it" / page count / lesson vs. print) for each —
    no ingestion action until he explicitly says to proceed. Ingested so far via
    `scripts/ingest_pdf.mjs` from `C:\Users\Isaac\Downloads`: Mill-Lesson-16,
    Mill-Lesson-15 (+ExA/ExB prints), Mill-Lesson-14 (+ExA/ExB), Mill-Lesson-13
    (+ExA/ExB), Mill-Lesson-12 (+ExA/ExB), Mill-Lesson-11 (+ExA/ExB),
    Mill-Lesson-10 (+ExA/ExB), Mill-Lesson-9 (+ExA/ExB). Also received (not yet
    ingested — general class reference, not lesson-specific):
    Setting-The-Environment.pdf, Surface Toolpath Overview-2024.pdf.
  - **Lessons 1-8 bulk-ingested 2026-10-31** from Isaac's 2TB backup SSD (H: drive,
    `H:\Backup 7-19-25\Downloads\`) at his request, since clean copies of these
    predate the one-at-a-time chat workflow and were already sitting on the backup
    drive. Deduped first (that folder had multiple re-download copies of several
    files, e.g. `Mill-Lesson-1 (1).pdf`/`(2).pdf` — confirmed byte-identical by file
    size before picking one), checked each filename against `mastercam_chunks`
    (all were new), then ingested via `scripts/ingest_pdf.mjs`. Ingested:
    Mill-Lesson-1.pdf (10 chunks) + ex-1a/ex-1b (1 chunk each), Mill-Lesson-2.pdf
    (18) + ex-2a/ex-2b (1 each), Mill-Lesson-3.pdf (26) + ex-3a/ex-3b (1 each),
    Mill-Lesson-4.pdf (26) + ex-4a/ex-4b (1 each), Mill-Lesson-5.pdf (39) +
    ex-5a/ex-5b (1 each), Mill-Lesson-6.pdf (21, no exercise prints found for this
    one), Mill-Lesson-7- New.pdf (38 — note the odd filename with "- New" in it;
    there was no plain Mill-Lesson-7.pdf, this was the only Lesson 7 main file in
    the folder) + ex-7a/ex-7b (1 each), Mill-Lesson-7B.pdf (48, separate lesson
    track from Lesson 7, not a duplicate) + Exercise-1/Exercise-2 (1 each),
    Mill-Lesson-8.pdf (60) + ex-8a/ex-8b (1 each). 23 files total, all new, nothing
    skipped as already-present.
    - These 4 extra course PDFs from the same folder were flagged in this first
      pass (not the Lesson 1-8 pattern) then **ingested 2026-11-01** on Isaac's
      go-ahead: `FBM-Lesson-1.pdf` (17 chunks), `Mill Advanced Lesson 2.pdf` (12),
      `WCS-Lesson-1.pdf` (9), `Solids-Lesson-4-ex-A.pdf` (1).
    - Still not ingested — `Mill-Lesson-7B.SLDPRT`, `Mill-Lesson-7B-ExA.SLDPRT`,
      `Mill-Lesson-7B-ExB.SLDPRT` (SolidWorks part files for Lesson 7B) — can't be
      ingested, same solid-file limitation noted below.
  - **Gotcha found 2026-10-31:** before re-ingesting a file Isaac sends, check
    `mastercam_chunks` for existing rows with that filename first (`ingest_pdf.mjs`
    has no dedup — re-running it on an already-ingested file creates duplicate
    chunk rows under a new timestamped storage_path). Query:
    `.../rest/v1/mastercam_chunks?select=filename,chunk_index&filename=eq.<name>`.
  - **Limitation noted 2026-10-31:** the pipeline (both MastercamTab.jsx and
    ingest_pdf.mjs) only extracts text from PDFs via pdfjs-dist. It can NOT ingest
    Mastercam solid files (.mcam, proprietary binary, no extractable text) or STL
    files (mesh data, no text). If Isaac wants those referenceable later, that's a
    different feature — store as an attachment only (upload to bucket, skip
    text-extraction/chunking) so Wadsworth can point to the file, not reason about
    its contents. Not built, not requested yet.
  - **REMOVED 2026-10-31:** the per-document "Remove" delete button/handler in
    MastercamTab.jsx — Isaac wants no delete option in the app for ingested PDFs.
    Deletion, if ever needed, should happen directly in Supabase, not via the UI.
  - Isaac also has a large personal/messy backlog of CNC notes and advice he wants
    compiled in eventually (separate from the Mastercam PDF library) — not sent
    yet, no format decided. Likely candidate: either folded into the existing
    `tips` table (Tip of the Day) or a new table/section once he sends it — revisit
    when he actually sends the material rather than designing for it now.
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
