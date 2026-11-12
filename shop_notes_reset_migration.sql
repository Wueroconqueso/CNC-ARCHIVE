-- Archive the auto-categorized content (Isaac didn't want my invented category scheme),
-- without losing the underlying extracted text. shop_notes table/policies/search function
-- stay as-is; just emptied and repurposed for Isaac's own user-created categories.

create table if not exists shop_notes_archive_2026_11_11 as table shop_notes;

truncate table shop_notes;

create table if not exists shop_note_categories (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table shop_note_categories enable row level security;

create policy "public read shop_note_categories" on shop_note_categories for select using (true);
create policy "public insert shop_note_categories" on shop_note_categories for insert with check (true);
create policy "public delete shop_note_categories" on shop_note_categories for delete using (true);
