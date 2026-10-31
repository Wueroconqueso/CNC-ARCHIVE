create table if not exists tips (
  id bigint generated always as identity primary key,
  content text not null
);
alter table tips disable row level security;

insert into tips (content) values
('Climb milling (down milling) gives a better finish and extends tool life in most materials, but needs a rigid setup — in a loose vise or thin fixture, conventional milling can be safer.'),
('When in doubt on chip load, go up in feed before you go up in speed — too light a chip load causes rubbing, heat, and premature tool wear more often than too heavy a one.'),
('Deburring between operations, not just at the end, keeps burrs from getting re-pressed into the part or interfering with the next fixture seat.'),
('A squealing end mill is almost always a feed problem (too light), not a speed problem — resist the urge to slow the spindle down first.'),
('Center drilling before a long drill reduces walking, but skip it for stub-length drills that are already rigid enough on their own.'),
('Check your CAM''s lead-in/lead-out — a straight plunge into the wall at full width removes any benefit of a trochoidal or ramped toolpath.'),
('Coolant through the tool clears chips far better than flood coolant alone in deep pockets and hole features — worth the extra setup time on anything beyond 2x diameter deep.'),
('A worn tool doesn''t just cut worse — it cuts hotter, which is often what actually kills dimensional accuracy on a long-running job, not the machine drifting.'),
('When truing up a vise or fixture, check square in both directions (X and Y against the spindle), not just that the jaw is parallel to table travel.'),
('Keep a log of actual speeds/feeds that worked, not just the chart numbers — the chart is a starting point, your specific tool/machine/material combo is the real answer.');
