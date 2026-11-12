create table if not exists tricks_of_the_trade (
  id bigint generated always as identity primary key,
  author text not null,
  label text not null,
  url text not null,
  created_at timestamptz not null default now()
);

alter table tricks_of_the_trade enable row level security;

create policy "public read tricks_of_the_trade" on tricks_of_the_trade for select using (true);
create policy "public insert tricks_of_the_trade" on tricks_of_the_trade for insert with check (true);

insert into tricks_of_the_trade (author, label, url) values (
  'Isaac',
  'CNC Machining Notes — Organized (PDF)',
  'https://lwinvwocxtstvyhkicpv.supabase.co/storage/v1/object/public/mastercam-pdfs/personal-notes/CNC_Machining_Notes_Organized.pdf'
);
