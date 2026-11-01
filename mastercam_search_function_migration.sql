-- Switches Mastercam chunk search from "match every word" (AND) to
-- "match any word, rank by how many matched" (OR + relevance ranking).
-- plainto_tsquery parses/stems the question into an AND query; we flip
-- the ANDs to ORs before running it, so a question doesn't fail to match
-- just because one word (e.g. a lesson number) doesn't line up.
create or replace function search_mastercam_chunks(search_query text, match_limit int default 5)
returns table(filename text, content text) as $$
  select mc.filename, mc.content
  from mastercam_chunks mc,
       to_tsquery('english', replace(plainto_tsquery('english', search_query)::text, ' & ', ' | ')) as q
  where mc.search @@ q
  order by ts_rank(mc.search, q) desc
  limit match_limit;
$$ language sql stable;

grant execute on function search_mastercam_chunks(text, int) to anon;
