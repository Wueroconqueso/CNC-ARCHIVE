-- Adds a per-person "author" to daily_notes so each person using the app
-- (via the free-text name selector, no real login) gets their own note per
-- day instead of one shared note. Existing notes (all written before this
-- feature existed) are backfilled as "Isaac" since he's the only one who's
-- used the app so far.

alter table daily_notes add column if not exists author text;
update daily_notes set author = 'Isaac' where author is null;
alter table daily_notes alter column author set not null;

-- Old uniqueness was on (date) alone -- drop it and replace with
-- (date, author) so two people can each have their own note on the same day.
alter table daily_notes drop constraint if exists daily_notes_pkey;
alter table daily_notes add primary key (date, author);

-- search_daily_notes gets an author filter so Wadsworth only surfaces the
-- asking person's own notes, not everyone's.
drop function if exists search_daily_notes(text, int);
create or replace function search_daily_notes(search_query text, author_filter text, match_limit int default 5)
returns table(note_date date, content text) as $$
  select dn.date, dn.content
  from daily_notes dn,
       to_tsquery('english', replace(plainto_tsquery('english', search_query)::text, ' & ', ' | ')) as q
  where dn.author = author_filter
    and to_tsvector('english', dn.content) @@ q
  order by ts_rank(to_tsvector('english', dn.content), q) desc
  limit match_limit;
$$ language sql stable;

grant execute on function search_daily_notes(text, text, int) to anon;
