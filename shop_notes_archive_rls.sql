alter table shop_notes_archive_2026_11_11 enable row level security;
create policy "public read shop_notes_archive" on shop_notes_archive_2026_11_11 for select using (true);
