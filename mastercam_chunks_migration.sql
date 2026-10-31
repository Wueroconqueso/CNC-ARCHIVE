create table if not exists mastercam_chunks (
  id bigint generated always as identity primary key,
  filename text not null,
  chunk_index int not null,
  content text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  search tsvector generated always as (to_tsvector('english', content)) stored
);

create index if not exists mastercam_chunks_search_idx on mastercam_chunks using gin (search);

alter table mastercam_chunks disable row level security;
