-- Wadsworth full-app search, step 1: run this whole file in the Supabase SQL editor.
--
-- What this does:
-- 1. Creates `gcodes` and `mcodes` tables (currently hardcoded arrays in
--    GCodesTab.jsx / MCodesTab.jsx) and loads them with the existing data,
--    so there's one source of truth the app and Wadsworth both read from.
-- 2. Adds search_daily_notes(), matching the same OR-ranked pattern as
--    search_mastercam_chunks() (see mastercam_search_function_migration.sql)
--    — daily notes can grow to hundreds of rows over time, so (unlike the
--    small gcodes/mcodes/tips tables, which Wadsworth just reads in full)
--    they need real search rather than a full dump every request.

-- ============================================================
-- G-Codes
-- ============================================================
create table if not exists gcodes (
  code text primary key,
  definition text not null,
  example text not null,
  sort_order int not null
);

alter table gcodes enable row level security;
drop policy if exists "Public read gcodes" on gcodes;
create policy "Public read gcodes" on gcodes for select using (true);
grant select on gcodes to anon;

insert into gcodes (code, definition, example, sort_order) values
('G00', 'Rapid positioning — moves at the machine''s max traverse rate, not a programmed feed.', 'Moving the tool quickly to a start point above the part, with no cutting happening.', 1),
('G01', 'Linear interpolation — moves in a straight line at the programmed feed rate.', 'The workhorse code for actually cutting a straight edge or wall.', 2),
('G02', 'Circular interpolation, clockwise.', 'Cutting a clockwise arc or circle, like rounding a corner.', 3),
('G03', 'Circular interpolation, counter-clockwise.', 'Cutting the other half of a circular pocket.', 4),
('G04', 'Dwell — pauses motion for a specified amount of time.', 'G04 P1000 pauses 1 second, sometimes used to let a drill clear chips at the bottom of a hole.', 5),
('G17', 'Selects the XY plane for circular interpolation and cutter compensation.', 'The default plane for almost all standard milling operations.', 6),
('G20 / G21', 'Sets programming units to inches (G20) or millimeters (G21).', 'Needs to match whatever units your program''s numbers are written in, or everything will be scaled wrong.', 7),
('G28', 'Returns the machine to its reference (home) position.', 'Commonly run before a tool change so the tool changer has clearance.', 8),
('G40', 'Cancels cutter diameter compensation.', 'Turns off any left/right offset so the tool follows the programmed line exactly.', 9),
('G41 / G42', 'Applies cutter compensation to the left (G41) or right (G42) of the programmed path.', 'Lets you program the actual part outline and have the control offset for tool radius automatically.', 10),
('G43', 'Turns on tool length compensation using the offset for the active tool (H number).', 'G43 H1 tells the control to add tool #1''s length offset so Z moves land where expected.', 11),
('G49', 'Cancels tool length compensation.', 'Used at the end of a program or before a move where the offset shouldn''t apply.', 12),
('G54–G59', 'Selects one of six work coordinate systems (fixture offsets).', 'G54 for vise position 1, G55 for vise position 2 — same program, different zero points.', 13),
('G80', 'Cancels any active canned cycle (like drilling or tapping cycles).', 'Called after a series of G81 drilling cycles so the next move doesn''t repeat the cycle.', 14),
('G90 / G91', 'Positioning mode: absolute from part zero (G90) or incremental from the last position (G91).', 'G90 is used for almost everything; G91 is handy for a repeated pattern of equally spaced holes.', 15),
('G94 / G95', 'Feed mode: per-minute (G94) or per-revolution (G95).', 'G94 is standard for milling; G95 ties feed directly to spindle RPM, which matters more in turning.', 16),
('G98 / G99', 'In a canned cycle, returns to the initial Z height (G98) or the R-plane height (G99) between repeats.', 'G99 is faster between holes on a clear part; G98 is safer when there''s an obstacle like a clamp.', 17)
on conflict (code) do nothing;

-- ============================================================
-- M-Codes
-- ============================================================
create table if not exists mcodes (
  code text primary key,
  definition text not null,
  example text not null,
  sort_order int not null
);

alter table mcodes enable row level security;
drop policy if exists "Public read mcodes" on mcodes;
create policy "Public read mcodes" on mcodes for select using (true);
grant select on mcodes to anon;

insert into mcodes (code, definition, example, sort_order) values
('M00', 'Program stop — halts execution, spindle, and coolant until cycle start is pressed again.', 'Used mid-program to check a part or make an adjustment before continuing.', 1),
('M01', 'Optional stop — like M00, but only pauses if the optional stop switch is turned on.', 'Handy for checking the first part off a new program without needing it on every run after that.', 2),
('M02', 'End of program — stops the program; does not rewind or reset modal states.', 'Marks the very end of a simple program that won''t run again immediately.', 3),
('M03', 'Spindle on, clockwise rotation.', 'Standard direction for the vast majority of right-hand cutting tools in milling.', 4),
('M04', 'Spindle on, counter-clockwise rotation.', 'Used for left-hand cutting tools, or specific tapping/threading operations.', 5),
('M05', 'Spindle stop.', 'Called before a tool change or at the end of a program.', 6),
('M06', 'Tool change — swaps to the tool number specified by the T word.', 'M06 T5 tells the machine to load tool #5 from the carousel.', 7),
('M08', 'Coolant on (flood coolant).', 'Turned on before engaging a cut in materials that generate heat, like steel.', 8),
('M09', 'Coolant off.', 'Called before a tool change or at the end of the program.', 9),
('M30', 'End of program and reset — stops and rewinds to the beginning, resetting modal conditions.', 'Used at the end of a production program that will be run again and again.', 10),
('M48', 'Enables feedrate/spindle speed override controls.', 'Restores manual override control after it''s been locked out by M49.', 11),
('M49', 'Disables feedrate/spindle speed override controls, forcing programmed values.', 'Used where overriding the feed could cause a crash or a bad part.', 12),
('M98', 'Calls a subprogram.', 'M98 P1000 runs subprogram O1000 — useful for repeating the same pocket or drilling pattern in multiple places.', 13),
('M99', 'Returns from a subprogram back to the calling program.', 'Placed at the end of the subprogram so control passes back to where it left off.', 14)
on conflict (code) do nothing;

-- ============================================================
-- Daily notes search (same OR-ranked pattern as search_mastercam_chunks)
-- ============================================================
create or replace function search_daily_notes(search_query text, match_limit int default 5)
returns table(note_date date, content text) as $$
  select dn.date, dn.content
  from daily_notes dn,
       to_tsquery('english', replace(plainto_tsquery('english', search_query)::text, ' & ', ' | ')) as q
  where to_tsvector('english', dn.content) @@ q
  order by ts_rank(to_tsvector('english', dn.content), q) desc
  limit match_limit;
$$ language sql stable;

grant execute on function search_daily_notes(text, int) to anon;
