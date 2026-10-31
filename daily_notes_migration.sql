create table if not exists daily_notes (
  date date primary key,
  content text not null default '',
  updated_at timestamptz not null default now()
);
alter table daily_notes disable row level security;
