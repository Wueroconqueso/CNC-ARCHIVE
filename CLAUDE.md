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

## Status / backlog (as of 2026-11-01 — building out into a bigger app, brick by brick)
- **Session end state, 2026-11-01 — everything below is live and working:**
  Mastercam knowledge base is complete (50 files — all of Mill-Lessons 1-16
  plus 7B/11B and 4 extra course PDFs — ingested, searchable, openable from
  the app, sorted by lesson number). Wadsworth answers grounded in that
  library via a working search function (OR+ranked, not strict AND — see the
  Step 3 entry below for why that matters). UI pass done: full-width layout,
  gold hamburger icon, navy color scheme, no delete option anywhere in the
  Mastercam tab. Everything in this paragraph is committed and pushed to
  `main`. **Known gap, not yet built:** Wadsworth's search only covers the
  Mastercam PDFs — M-Codes/G-Codes (hardcoded, not in the database) and
  daily_notes/tips (in the database but not wired into search) aren't
  searchable by Wadsworth yet. Isaac knows this and said to revisit later,
  not now. **Also pending:** Isaac's personal/messy CNC notes backlog —
  he hasn't sent it yet, no format decided.
- **2026-11-04 — Wadsworth now searches the whole app, plus the web (build in progress,
  needs Isaac to run two deploy steps — see below).** Closes the gap noted above.
  - **G-Codes and M-Codes moved from hardcoded arrays into real tables** (`gcodes`,
    `mcodes` — same code/definition/example data, plus a `sort_order` column so the tabs
    display in the original order). `GCodesTab.jsx`/`MCodesTab.jsx` now fetch from
    Supabase instead of a hardcoded const. This was the prerequisite noted above — nothing
    hardcoded can be searched/read by the Edge Function.
  - **wadsworth-chat rewritten** to pull in everything: `gcodes`, `mcodes`, and `tips` are
    small/bounded, so instead of searching them it just hands Wadsworth the full list every
    request (cheap, and guarantees it actually knows every code rather than hoping a
    keyword search ranks the right one to the top). `daily_notes` gets real search instead
    — it can grow to hundreds of rows over a year — via a new `search_daily_notes()`
    function, same OR-ranked pattern as `search_mastercam_chunks()` (see the 2026-11-01
    entry above for why OR instead of strict AND). The Mastercam PDF search is unchanged.
  - **Web search added** — Claude's server-side `web_search_20260209` tool, capped at
    `max_uses: 3` per message to bound cost. System prompt tells Wadsworth to prefer
    Isaac's own app content first and only reach for the web for things not covered by his
    material (manufacturer spec sheets, control-specific quirks, general lookups). Isaac
    said up front he may turn this back off later if it gets too expensive to run — if he
    says to disable it, remove the `tools` array from the Anthropic request body
    (`supabase/functions/wadsworth-chat/index.ts`) rather than deleting the surrounding
    plumbing, since that's a one-line, easily-reversible change.
  - Reply-parsing also fixed in the same rewrite: the old code took only the *first* text
    block from Claude's response; with web search, replies can interleave multiple text
    blocks with search-result blocks, so it now joins every text block in order. Added
    `pause_turn` handling too — multi-step web search can span more than one API turn, so
    the function now resumes automatically (capped at 3 continuations) instead of cutting
    the answer short.
  - **Not yet deployed as of this entry** — needs Isaac to do what he's done for every
    prior backend change on this project (no CLI access set up here):
    1. Run `wadsworth_full_search_migration.sql` in the Supabase SQL editor (creates
       `gcodes`/`mcodes`, loads their data, adds `search_daily_notes()`).
    2. Paste the new `supabase/functions/wadsworth-chat/index.ts` into the Edge Function
       editor in the Supabase dashboard and deploy.
    Verify afterward by asking Wadsworth something only a G-code/M-code/daily-note/web
    answer could get right, confirming each source actually gets used.
  - **DONE 2026-11-10/11 — Supabase CLI link set up.** Isaac ran `supabase login`
    himself (browser OAuth — CLI binary lives at `C:\Users\Isaac\bin\supabase.exe`, not
    on PowerShell's PATH, so use the full path or Git Bash) and I ran `supabase link
    --project-ref lwinvwocxtstvyhkicpv` ("Machine Database" project). Confirmed working
    via `supabase db query --linked` (read) and real migrations/function deploys
    (write) — both now run directly from the CLI instead of the manual dashboard paste
    workflow. Added `supabase/.temp/` to `.gitignore` (local link state, machine-specific).
    **Standing backup rule agreed with Isaac:** before any migration that alters/drops
    existing data (not needed for purely-additive changes like a new table/column), back
    it up first. `supabase db dump` needs Docker, which isn't installed here, so the
    practical method is `supabase db query --linked "select row_to_json(t) from
    <table> t"` saved to a local JSON file in `backups/` (gitignored).
  - First two real deploys done this way: the `wadsworth_full_search_migration.sql`
    (gcodes/mcodes/search_daily_notes — see above) and the wadsworth-chat deploy for
    multi-user notes (see below). Both verified live, not just assumed to have worked.
- **2026-11-04 — two ideas floated for later, not started (Isaac was away from his
  computer, no Supabase access):**
  1. **Quick-capture "sorting center":** a way to type a learning in on the spot and have
     it append to one running document, instead of filing it anywhere specific. **Now
     confirmed (2026-11-11) to be the same system as the personal shop notes plan below**
     — the future "add new things" section described there is this idea, just scoped to
     append to the structured notes table once it exists.
  2. **Real multi-user sign-in — scoped down and DONE 2026-11-11, see below.** (Originally
     floated as real separate accounts/auth; Isaac later clarified what he actually wanted
     was simpler — see entry below.)
- **PLAN AGREED 2026-11-11 — personal shop-floor notes system (not yet built, waiting on
  Isaac to send files).** Isaac has a long personal Word document of CNC notes/advice
  written over years from real shop-floor experience, which he references constantly and
  wants brought into the app. He'll send it (and future notes) as chat attachments when
  he has time. Agreed workflow for each file, once sent:
  1. **Original copy** — save the file exactly as uploaded, untouched, to Supabase
     storage (reuse the `mastercam-pdfs` bucket's `personal-notes/` path — already in use
     for `Lesson_15_and_16_notes.pdf`, see the 2026-11-04 entry above). This is the
     permanent backup; never edited or deleted.
  2. **Edited copy, structured** — parse the document and split it into individual
     discrete entries (one row per distinct tip/lesson-learned), into a new table (name
     TBD, e.g. `shop_notes`) — same pattern as the existing `tips` table, not a single
     rewritten blob. This is what makes dedup, per-entry search, and future additions
     actually work.
  3. **Dedup** — drop exact-duplicate entries when splitting into rows.
  4. **Edited copy, readable** — Isaac also wants a second, human-readable cleaned/deduped
     document (organized, same substance as his original — not AI-reworded domain advice)
     that he can still open and read top-to-bottom outside the app, in addition to the
     database rows. Maintain both, not just one.
  5. **Wadsworth search** — add a `search_shop_notes()` function once the table exists,
     same OR-ranked full-text search pattern as `search_mastercam_chunks()`/
     `search_daily_notes()`.
  6. **Referencing/adding to the app** — Isaac will explicitly tell me when to pull
     specific info out of these notes to reference or add to other parts of the app
     (G-Codes/M-Codes/Tips tabs, etc.) — not automatic just because it's ingested.
  7. **Future, confirmed not needed yet** — an in-app "quick capture" section to type a
     new learning in on the spot and append it to this same table. This is the same idea
     as the 2026-11-04 "sorting center" entry above; build it later, same table.
  - **`Lesson_15_and_16_notes.pdf` folds into this system** — Isaac confirmed (2026-11-11)
    to process it as the first file under this workflow once building starts, rather than
    leaving it as an untouched raw file.
  - **DONE 2026-11-11 — first file processed, same session as the plan above.** Isaac
    sent `Codex_My_Edit_Official_10-13-26.docx` (893 paragraphs, ~30k characters, years of
    real shop-floor notes — tapping/drilling/reaming math, material speeds & feeds,
    G-code/M-code reference, troubleshooting fixes, shop-mindset tips, open questions he'd
    jotted and never resolved). Processed exactly per the agreed plan:
    1. **Original** uploaded untouched to the `mastercam-pdfs` bucket at
       `personal-notes/Codex_My_Edit_Official_10-13-26.docx` (verified 200, correct
       content-type/length).
    2. **Parsed into 315 discrete entries** across 20 categories (Tapping 37, Drilling 17,
       Materials-Plastic 27, Shop Practices & General Notes 23, Open Questions 27, etc.) —
       split by reading the actual paragraph/blank-line structure (python-docx extraction,
       no pandoc available on this machine), not a blind line-split. One off-topic
       paragraph (a recipe/shopping note that had landed in the middle of the doc by
       accident) was pulled out and flagged to Isaac rather than inserted.
    3. **Deduped exact repeats** (case/whitespace-insensitive) — caught real duplicates
       like a Winchester-job G-code block pasted 3 times and a G5.1Q1 definition pasted 4
       times with minor formatting differences; near-duplicates with different wording
       (e.g. "tall hole wants a reamer" stated two different ways) were deliberately left
       as separate entries rather than guessed-merged.
    4. **New `shop_notes` table** (`shop_notes_migration.sql`: id/category/content/
       source_file/created_at, RLS + public read/insert policies, GIN tsvector index) —
       run via the linked Supabase CLI. 315 rows confirmed loaded.
    5. **`search_shop_notes()`** function added (same OR-ranked full-text pattern as
       `search_mastercam_chunks`/`search_daily_notes`) and wired into `wadsworth-chat`
       (not author-scoped — this is Isaac's own shared knowledge base, unlike per-person
       daily notes). Deployed via CLI.
    6. **Readable copy**: `shop_notes_organized.md` — same 315 entries grouped under
       category headings, wording kept verbatim (reorganized, not reworded). Saved both
       in the repo and as a cloud backup in the same storage bucket
       (`personal-notes/shop_notes_organized.md`).
    - **Verified live before calling it done**: asked Wadsworth a reaming speed/feed
      question only his own notes could answer correctly — it answered grounded in the
      exact numbers from his notes ("half the speed and double the feed... 3 to 5 percent
      of diameter... leave about .003 per side") rather than generic advice.
    - **DONE 2026-11-11 (same session) — `Lesson_15_and_16_notes.pdf` folded in too.**
      This file is a different shape — a sequential walkthrough of specific Mastercam
      toolpaths (OptiRough, Waterline, 2D Contour, Pencil, stock models/rest machining,
      2D Area Mill, Equal Scallop, Spiral) rather than standalone one-line tips — so it
      was chunked by toolpath/topic (36 entries) instead of split line-by-line, which
      would have orphaned steps like "then click green check" from what they refer to.
      Extracted via `pypdf` (no pandoc on this machine; python-docx handled the other
      file, pypdf handles PDFs). All 36 rows tagged category `MasterCam / Gibbs Software
      Notes`, `source_file = 'Lesson_15_and_16_notes.pdf'` (`shop_notes_lesson1516_migration.sql`).
      **Deliberately NOT ingested into `mastercam_chunks`/shown in the Mastercam tab** —
      that table/tab is the official course library; mixing in Isaac's own commentary
      there with no visual distinction would blur which is which (same reasoning already
      on record from 2026-11-04 for why this file wasn't auto-ingested back then).
      `shop_notes` now has 351 rows total. Readable doc and cloud-backup copy
      regenerated from the live table (not just the local pickle) to stay accurate, and
      now note `_(from Lesson_15_and_16_notes.pdf)_` next to entries from this file.
    - **DONE 2026-11-11 — new "Shop Notes" tab, so this is visible in the app, not just
      via Wadsworth.** (Superseded same day — see the reset entry directly below. Keeping
      this paragraph for history: original version auto-grouped into my own 20 invented
      categories; Isaac said that wasn't his intention.)
  - **PIVOT 2026-11-11 (same session) — reset to user-created categories, not
    auto-categorization.** Isaac: "I like what you did but that wasn't my intention... I
    like the tab down idea... but get rid of all the tabs you created, like the drop down
    menus. And instead give me a button to create new drop down menus. I can create them
    and over time tell you one by one what to put in there." He wants to build his own
    taxonomy by hand, dictating content category-by-category, not have me auto-sort his
    notes into categories I invented.
    - **Nothing was lost.** The 351 auto-categorized rows were moved to
      `shop_notes_archive_2026_11_11` (`create table ... as table shop_notes`) before
      truncating the live `shop_notes` table — recoverable if ever needed. The original
      `.docx`/`.pdf` backups in Supabase storage and `shop_notes_organized.md` (readable
      doc, still organized under the old categories) are untouched too — nothing here
      overwrites those.
    - **New `shop_note_categories` table** (`shop_notes_reset_migration.sql`: id/name
      unique/created_at, RLS + public read/insert/delete policies) — this is the list of
      Isaac's own category names, created empty, populated only via the app button.
    - **`shop_notes` table kept** (same schema/policies/search function as before,
      `search_shop_notes()` still wired into Wadsworth) but now starts empty — rows only
      get added when Isaac tells me what to file under which category.
    - **`ShopNotesTab.jsx` rewritten**: no hardcoded category list anymore — categories
      come live from `shop_note_categories`. Kept the collapsible-dropdown UI pattern
      Isaac said he liked. Added a "+ New Category" button (inline form, inserts into
      `shop_note_categories`) and a small "×" to delete a category. Each category shows
      "No notes in here yet" until Isaac dictates content for it. Search box only shows
      once at least one category exists.
    - **Verified with Playwright before calling it done**: tab loads with "No categories
      yet" + the button; creating "Reaming" via the button makes it appear immediately;
      expanding it shows "No notes in here yet"; zero console errors. Test category
      deleted after verifying.
    - **How new content gets added going forward**: Isaac creates a category via the
      button in the app; he then tells me (in chat) what to put in it; I insert rows into
      `shop_notes` with that `category` value via SQL migration, same as before — there is
      no in-app "add note" form, only category creation is self-serve.
- **DONE 2026-11-11 — per-person daily notes via a free-text name selector (not real
  auth).** Isaac clarified the actual need: "a few friends" use the app sometimes and
  just want their own notes kept separate — not real login/security between them. Built
  the lightweight version instead of full Supabase Auth:
  - `daily_notes` restructured: added an `author` text column, backfilled existing rows
    as "Isaac", and changed the table's uniqueness from `(date)` alone to `(date,
    author)` so multiple people can each have their own note on the same day
    (`daily_notes_multiuser_migration.sql`). This was a real structural change to
    existing data, not additive — backed up first per the new standing rule above.
  - `search_daily_notes()` now takes an `author_filter` param so Wadsworth only
    searches the asking person's own notes, never everyone's.
  - New `src/identity.js` (localStorage get/set) + `src/NameBadge.jsx` (small badge,
    top-right of every tab, click to change) — first visit prompts for a name once,
    remembered per-device after that. No password, no real security — anyone can type
    any name; this matches the trust level Isaac actually wanted for friends using his
    app casually.
  - `HomeTab.jsx` and `WadsworthTab.jsx` both take the active name as a prop from
    `App.jsx`; Wadsworth's Edge Function system prompt now explicitly tells Claude who's
    asking isn't necessarily Isaac, and scopes daily-note context/search to that person.
  - **Verified two ways before telling Isaac it was done:** (1) a live curl test with a
    second fake "TestFriend" author confirmed Wadsworth correctly retrieved that
    person's own note and correctly told "Isaac" he had no notes on the same topic — no
    cross-person leakage; (2) a full Playwright browser test (name prompt appears,
    entering a name saves and persists across reload, the note saves/reloads scoped to
    that name) — all passed. Both sets of test data cleaned up from the real DB after.
  - Deployed via the new CLI link (migration + function deploy), not manual dashboard
    paste — first real use of the new access.
- **2026-11-04 — personal notes backlog started arriving.** Isaac began sending his own
  course notes (handwritten-style, taken while going through the Mastercam lessons) as
  chat attachments, to be saved for now with the format/home for them figured out
  later. First file: `Lesson_15_and_16_notes.pdf` (his own notes on OptiRough/Waterline/
  2D contour/pencil toolpath settings, stock models, rest machining, etc. from Lessons
  15-16) — uploaded as-is to the `mastercam-pdfs` storage bucket under
  `personal-notes/Lesson_15_and_16_notes.pdf` (cloud, not local-only, so it's backed up).
  Deliberately **not** ingested into `mastercam_chunks` and **not** shown in any tab yet —
  these are a different thing from the official lesson PDFs (his own notes/commentary,
  not the course material itself) and he hasn't said how he wants them organized or
  surfaced. Just accumulate them in that bucket path as more come in, one at a time,
  until Isaac decides what to do with them.
- App restructured: collapsible left-sidebar nav (closed by default, opens via a ☰
  button top-left, closes on picking a tab). Tabs so far: Wadsworth (AI assistant),
  Home (daily note + tip of the day), Equations, Speed & Feed Calculator, G-Codes,
  M-Codes, Tapping. Old multi-entry "Notes" journal removed from
  nav but code still exists, unused, at src/tabs/NotesTab.jsx.
- **2026-11-04 — Tapping tab no longer a placeholder:** added the Guhring Tap Drill
  Sizes & Decimal Equivalents chart (decimal equivalents, UNC/UNF + metric tap drill
  sizes at 55/65/75% thread, speed/feed key equations). Fetched from guhring.com and
  re-hosted in the `mastercam-pdfs` storage bucket under a `reference/` path (kept out
  of the Mastercam lesson DB/listing — it's not in `mastercam_chunks`, so it won't show
  up in the Mastercam tab or get indexed by Wadsworth's search). Shown as a simple link
  card ("Open PDF" opens the file in a new tab). Deliberately **not** embedded inline
  via `<iframe>` — tested in headless Chromium and it rendered blank; iOS Safari is
  known to not render PDFs inside iframes at all, which would break it on Isaac's phone
  (the app's PWA install target). The link-card pattern (reused from MastercamTab.jsx)
  is the reliable cross-device approach — use it again for any other static reference
  PDF added outside the searchable Mastercam library.
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
  - Step 2 (DONE — the SQL blockers below were both resolved later the same
    session): built src/tabs/MastercamTab.jsx — upload a PDF, extract text
    client-side (pdfjs-dist, dynamically imported so its ~2MB doesn't bloat
    every page load), chunk it (~1500 chars, break on paragraph/sentence
    boundaries), upload original to the bucket, insert chunks into
    `mastercam_chunks`. Document list shows chunk counts, an "Open PDF" link
    per document (added 2026-11-01), and is sorted by lesson number (added
    2026-11-01) rather than alphabetically. **No delete/remove option** —
    removed 2026-10-31 at Isaac's request; any deletion happens directly in
    Supabase now.
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
      other buckets like Relicwise's `relicwise-videos`). **Confirmed run —
      ingestion has worked for 50+ files since.**
    - Also surfaced in the same test: the `tips` table genuinely did not exist
      (confirmed via direct REST call, 404) — the migration from the Tip of the Day
      build earlier got missed somehow, despite being given at the time. Re-sent
      `tips_migration.sql` contents to Isaac. **Confirmed run — Tip of the Day
      works on the Home tab now.**
  - **Step 3 (DONE, deployed 2026-11-01):** `wadsworth-chat` Edge Function now runs
    a Postgres full-text search against `mastercam_chunks` using the user's
    message before calling Claude. Up to 5 matching chunks get appended to the
    system prompt as context, with instructions to cite the filename/lesson and
    ignore the excerpts if they're not actually relevant. Uses Supabase's
    auto-injected `SUPABASE_URL`/`SUPABASE_ANON_KEY` env vars — no new secret
    needed. Deployed via dashboard paste (same as always — CLI still not linked
    for this project).
    - **First version used `plainto_tsquery` (AND all words) — found broken via
      live testing, fixed same day.** A strict AND match meant a question that
      happened to include an incidental word not present in the right chunk
      (e.g. "Mill-Lesson-9" — the literal digit "9" didn't tokenize cleanly next
      to page-number suffixes like "Mill-Lesson-9-3" in the PDF text) would
      return zero matches even though the actual answer was sitting right there.
      **Fixed** by adding a `search_mastercam_chunks(search_query, match_limit)`
      Postgres function (`mastercam_search_function_migration.sql`, run via the
      Supabase SQL editor) that flips `plainto_tsquery`'s ANDs to ORs and ranks
      results by how many words matched (`ts_rank`), instead of requiring every
      word to match. The Edge Function now calls this via Supabase RPC
      (`/rest/v1/rpc/search_mastercam_chunks`) instead of a raw PostgREST filter.
      Verified live — the exact question that failed before now correctly pulls
      Mill-Lesson-9's real tool spec (0.375" bull end mill, 0.0625" corner
      radius) and even flagged a real mix-up risk against Mill-Lesson-12's
      similar-but-different tool (0.031" corner radius) on its own.
    - Known remaining tradeoff: still plain keyword search (now OR+ranked, not
      semantic), so a question using very different words than the PDF text
      could still miss — upgrade path if that becomes a real problem is
      semantic/embedding search, which needs a separate API key and a
      per-query cost. Isaac's stated usage pattern is asking about topics/
      toolpaths/settings rather than lesson numbers by name, which this
      handles well.
    - **Wadsworth's search scope is Mastercam PDFs ONLY — not the rest of the
      app.** Asked about this 2026-11-01: M-Codes and G-Codes aren't even in
      the database to search — they're hardcoded data arrays baked directly
      into `src/tabs/MCodesTab.jsx` / `GCodesTab.jsx`, not database-backed.
      Daily notes and tips ARE in the database (`daily_notes`, `tips` tables)
      but nothing in `wadsworth-chat` queries them either. For a question like
      "what M-code stops the program," Wadsworth currently answers from its own
      general trained knowledge (M00/M01 — extremely standard, so it gets it
      right), NOT from the app's M-Codes tab — so if Isaac ever customizes that
      tab with his own notes/quirks, Wadsworth won't know about it until this
      is built. **Deferred, not requested yet.** If/when Isaac wants this: move
      M-Codes/G-Codes off hardcoded arrays into Supabase tables first (so
      there's something to search), then extend `search_mastercam_chunks`-style
      search to cover those tables plus `daily_notes`/`tips` too.
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
  - **INCIDENT 2026-11-01 — Lessons 9-15 (+11B) vanished from the database, then
    re-ingested:** while wiring up Wadsworth's full-text search (see Step 3 below),
    testing showed 0 chunks for any Lesson 9-15/11B filename, while Lesson 16,
    Lessons 1-8, and the 4 extra course PDFs were all still intact. Likely cause:
    the old per-document "Remove" delete button in MastercamTab.jsx (removed in
    code 2026-10-31 but not actually deployed/pushed until later that session) was
    still live in production the whole time Lessons 9-16 were being ingested —
    if Isaac opened the app and clicked Remove on any of them during that window,
    this is exactly the result it'd produce. Not confirmed, but fits the pattern
    exactly (everything ingested before the delete button was pushed out is what's
    missing). Fixed: re-ingested all of it from a clean canonical copy found on the
    2TB backup SSD at `H:\Sync\MASTER MACHINE FILE\ALL\Mastercam 3D course\
    MasterCam Practice!!!!!\3D 2026\Lesson N\Files\` (one lesson per folder —
    better source than Downloads, which was missing several of these main lesson
    files). Verified each file's title/topic against the original receipts before
    re-ingesting (all matched; page counts were off by exactly 1 from the original
    receipts across the board — a numbering-convention difference, not a content
    mismatch). Re-ingested: Mill-Lesson-9.pdf (28 chunks) + ExA/ExB (1 each),
    Mill-Lesson-10.pdf (26) + ExA/ExB (1 each), Mill-Lesson-11.pdf (23) + ExA/ExB
    (1 each), Mill-Lesson-11B.pdf (18), Mill-Lesson-12.pdf (36, source file on disk
    was misnamed `Mill-Lesson-12..pdf` with a double dot — copied to a clean
    filename before ingesting so the DB entry is consistent) + ExA/ExB (1 each),
    Mill-Lesson-13.pdf (29) + ExA/ExB (1 each), Mill-Lesson-14.pdf (32) + ExA/ExB
    (1 each), Mill-Lesson-15.pdf (27, no separate exercise prints — same as
    originally). 50 distinct filenames in the DB total now. The delete button is
    gone from the live app as of the push earlier in this session, so this
    shouldn't be able to happen again — but there's no undo/trash, so if it ever
    needs to come back, add a soft-delete (archived flag) rather than a hard
    delete button.
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
