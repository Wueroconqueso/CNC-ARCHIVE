-- shop_notes_migration.sql
-- Personal shop-floor notes from Codex_My_Edit_Official_10-13-26.docx
-- Agreed plan 2026-11-11: original copy in storage, structured entries here, readable doc also kept.
create table if not exists shop_notes (
  id bigint generated always as identity primary key,
  category text not null,
  content text not null,
  source_file text not null default 'Codex_My_Edit_Official_10-13-26.docx',
  created_at timestamptz not null default now()
);

alter table shop_notes enable row level security;
drop policy if exists "public read shop_notes" on shop_notes;
create policy "public read shop_notes" on shop_notes for select using (true);
drop policy if exists "public insert shop_notes" on shop_notes;
create policy "public insert shop_notes" on shop_notes for insert with check (true);

create index if not exists shop_notes_fts_idx on shop_notes using gin (to_tsvector('english', content));

insert into shop_notes (category, content) values
  ('Tapping', 'For tapping cycle to do the calculation to find feed, do spindle speed/RPM X thread pitch'),
  ('Drilling', 'Peck depth for a drill = the Diamater of the drill'),
  ('Materials - Aluminum', 'Coating Al titanium Nitrate, the new Kennametal coating brown coating'),
  ('Open Questions / To Follow Up', 'What coating is common on drills?'),
  ('Open Questions / To Follow Up', 'Common angle for drills and endmills'),
  ('Open Questions / To Follow Up', 'Gorilla tools'),
  ('Threads & Tap Sizing', 'Figuring out your pitch for imperial taps, just do 1 divided by the 2nd number on the tap. 8-32, You would do 1/32 and you would get .0312 for your thread pitch'),
  ('Tapping', 'G94 is feed per minute (not the one we want to use for tapping)( but what most of the program is typically in.)(even if you don’t see a G94! Mill machines will typically default to this code.!
If you do use this for tapping you want to multiply your RPM X Pitch and you will get your F you want.  So Feed=Pitch X RPM. If you have 300 Rpm and a pitch of .0125, you get 300X.0125(0-80 thread) So your F should be F3.75,
Important to remember, if your RPM changes you have to do the math again and refigure your F=Pitch X RPM'),
  ('Tapping', 'G95 Feed per Rev. The preferred method for tapping, but you do need to switch into G95 and back to G94 after for the rest of the program. With this you can put your feed at exactly what the pitch is. An 0-80 thread will be a F of .0125 (which is the pitch)'),
  ('Tapping', 'It can feel safer to use the G95 because all you need for the feed is the pitch. But for this instance in this shop, I want to keep the G94 consistent, especially because some of these programs don’t even have a G94 listed in the program. So if i forget to switch back to G94 i could be in trouble'),
  ('Tapping', 'M29, not for the HAAS. But confidently used on other machines.'),
  ('G-Code & M-Code Reference', 'G84 canned cycle used for right-hand rigid tapping, a standard CNC canned cycle used for right-hand rigid tapping to machine internal threads into pre-drilled holes. It synchronizes the spindle rotation and the Z-axis feed rate, turning clockwise to tap to the bottom of the hole, reversing the spin direction, and retracting back out. Has X_Y_Z_R_F_'),
  ('G-Code & M-Code Reference', 'G98 commands an Initial Point Return during canned cycles (like drilling or tapping), meaning the tool retracts back to the starting Z-axis height above the part after each hole.'),
  ('G-Code & M-Code Reference', 'Ex: G84 G98 X-.0669 Y3.6195 Z-.15 R.1 F_'),
  ('Tapping', 'The G84 cycle without the m29 was more common for floating holders, older style, haas always triggers rigid tapping with G84.'),
  ('Tapping', 'To get length of incomplete threads to determine how much farther the tap needs to go, each thread is the length of pitch, so just count unfinished threads and multiply by the pitch'),
  ('Tapping', 'For example put cylindrical thing in hole and it gets stuck tap on aluminum or same material for it to come out'),
  ('Endmills & Milling', 'To lower tool pressure, you want to lower chip load! Less chip load is less tool pressure!'),
  ('Code Examples (Job-Specific)', 'Winchester job tapping cycle example:
N110G17G94G40G80G49
T7M6
T8
G54
G0G90X-.0669Y3.6195B0
G43Z.1H7
M8
G94
G84S1000X-.0669Y3.6195Z-.15R.1F12.5
Y2.5995
Y2.3457
Y1.3257
Y1.0719
Y.0519
G80G0Z.1
M9
G91G30Z0.M19
M1'),
  ('G-Code & M-Code Reference', 'G5.1Q1 is a FANUC G-code command that turns on Advanced Preview Control, also known as AI Contour Control (AICC) or nano smoothing, for high-speed and high-precision machining.
How It Works
- Look-ahead capability: The CNC control pre-reads and analyzes hundreds of blocks of code ahead of time (typically 200 to 1,000 blocks) instead of reading just one line at a time.
- Smooth acceleration and deceleration: It calculates corners and curved paths smoothly, preventing the machine from shaking or "banging" during rapid contour changes.
- R-value adjustment: You can add an R value (usually R1 to R10) to balance speed versus precision, where lower numbers favor speed (roughing) and higher numbers favor accuracy (finishing).
Proper Programming Usage
- Turning it on: Place G5.1 Q1 (or G5.1 Q1 Rx where x is 1-10) right before your linear or cutting moves (G01), typically after tool length compensation is active. Do not place it right before a rapid move (G00).
- Turning it off: Cancel the mode using G5.1 Q0 immediately after your cutting path ends and before program completion or returning axes to zero. Avoid turning it on or off midway through complex subroutines to prevent coordinate shifts or alarms.'),
  ('Shop Practices & General Notes', 'Describe in the top of the program everything'),
  ('Open Questions / To Follow Up', 'program edits? Speed up'),
  ('Code Examples (Job-Specific)', 'Trash version (do not use) - from paper, T9 Roughing codes:
G5.101
G5.1QO'),
  ('Code Examples (Job-Specific)', 'Trash version (do not use) - Finishers:
G05P10000
G05P0'),
  ('Code Examples (Job-Specific)', 'Correct version - from program, T9 Roughing codes:
G5.1Q1
G5.1Q0'),
  ('Code Examples (Job-Specific)', 'Correct version - T10 Finishing Codes:
G05P10000
G05P00000'),
  ('Job-Specific Notes', 'Tool list, Winchester job (upload tool list every time):
1.) 1/4 Rough
2.) 1/4 Finish
3.) 1/8 Rough
4.) 1/8 Finish
5.) .09 Drill mill
6.) 1.45mm Drill .0571 for Pre-Plate 0-80 Thread
7.) 0-80 form tap for preplate dimensions H6
8.) #50 Drill .07
9.) .062 Rough Em
10.) .062 Finish EM
11.) .005 CREM
12.) .047 rough EM
13.) .047 Finish EM (.031 Finish EM)
14.) .017 X .06 Keyseat
15.) .04 Finish EM
23.) .035 Em, cutter .06 Diameter'),
  ('Speeds & Feeds', 'Speeds & feeds term glossary: RPM = Spindle Speed = S_ Code = n. SFM = Cutting Speed = Vc (get from catalog). IPM = Feed Rate/Table Feed/Feed = F_ Code = Vf. FPT = chip load = Fz (get from catalog). FPR = Feed Per Rev/IPR = Fn (get from catalog). Z = number of flutes. D (D1 or Dc) = Diameter of tool. RDOC = Radial depth of cut, Width of Cut = ae. ADOC = Axial depth of Cut, Depth of Cut = ap.'),
  ('Endmills & Milling', 'Slotting you want to take about 25% less than when side cutting'),
  ('Speeds & Feeds', 'F_ = FEED PER REV X RPM'),
  ('Speeds & Feeds', 'RPM = (SFM x 3.82) / Diameter of tool'),
  ('Speeds & Feeds', 'Feed = (FPT x #teeth x RPM)'),
  ('Speeds & Feeds', 'FPT = IPM / (RPM x # of flutes)'),
  ('Speeds & Feeds', 'SFM = (RPM X 3.14 X dia) / 12'),
  ('Drilling', 'Peck drilling cycle G83 G99 (R.1 Q.03 F13). G83 = pecking, G82 = spotting, G81 = drilling'),
  ('Drilling', 'Rule of thumb: peck equal to dia of drill. Rule of thumb: peck amount should be half of the diameter of the drill. For SS use 25% for peck'),
  ('Endmills & Milling', 'Depth cuts can be half the diameter of the tool'),
  ('Facemilling', 'Face mill / # of teeth. AL face 10000 and 80'),
  ('Threads & Tap Sizing', 'Tap chart: 4-40 form tap #39 .0995. 4-40 cut tap .112 #43 .0890. Newer: 4-40 FORM - #38 .1015. 6-32 FORM - 3.1MM .122 (3.15 NOMINAL). 8-32 FORM - #25 .1495 (V). 1/4-20 SPIRAL - #7 .201. M3x0.5 FORM .118 - 7/64 .109 (?)'),
  ('Threads & Tap Sizing', 'Always add .015 chamfer to each side of tap. 6-32, just take 1/32 and you will get your thread pitch.'),
  ('Threads & Tap Sizing', 'UNC = Unified Coarse Thread = NC National Coarse Thread (coarse threads are harder to cross thread). Ex: 10-24'),
  ('Threads & Tap Sizing', 'UNF = United National Fine = NF National Fine Thread (fine threads are stronger, less likely to loosen). Ex: 10-32'),
  ('Threads & Tap Sizing', 'NPT = National Pipe Tapered Thread (United States). Connects pipes and fittings to carry fluids and gases. MPT or MNPT or NPT = male external pipe threads. FPT, FNPT or NPT(F) = female internal threads'),
  ('Threads & Tap Sizing', 'STI = Screw Thread Insert (for helicoil)'),
  ('Tapping', 'Feed = pitch X RPM'),
  ('Tapping', 'FPT is the pitch'),
  ('Reaming', 'Reamer should be half the speed and double the feed of drill calc. Should be 3 to 5 percent of diameter cutting'),
  ('Reaming', 'Plastic, reaming, going to want to use an oversized reamer because material deflects. Plastic, reaming, try a faster feed (white circle gear part). Plastic High Tol hole: you can use a brand new em, reamer possibly considered better, w/ em material may be tapered or deflect. Leave .003 for reamer per side on average'),
  ('Reaming', 'When its a tall hole, typically will want to use a reamer!'),
  ('Tapping', 'haas m29 -> m3'),
  ('Shop Practices & General Notes', 'Take time. Look and see what all your tools are doing before doing program, S&F, should not need a setup sheet'),
  ('Shop Practices & General Notes', 'Go faster'),
  ('Shop Practices & General Notes', 'Expect things to go wrong! Plan for them to go right!'),
  ('Inspection & Quality', 'Need to check for after anodizing!! Check all notes on print!! Visual inspect'),
  ('G-Code & M-Code Reference', 'G41/G40 arc-exit fix, example 1 - before:
G41 D2 X0. Y.0592 I-.0592 J0.
G0 Z.1
(arc move stuck after leaving circle)
after:
X0. Y.0592 I-.0592 J0.
G1 G41 D2 Z.1 F10.
Cannot have a G40 or G41 on an arc move, it needs to be on a linear move. Also: can move the G40 down to a new line, e.g. G1 G40 Y-.25 - watch where your lead in/out is, usually can just move Y a straight move down a few thou.'),
  ('G-Code & M-Code Reference', 'G41/G40 arc-exit fix, example 2 - before:
G40X2.0377Y-.2345I0.J-.0155
G0Z.5
after:
X2.0377Y-.2345I0.J-.0155
G1G40Z.5F25.'),
  ('Shop Practices & General Notes', 'Take the time and try to figure it out'),
  ('Shop Practices & General Notes', 'Would you rather be running the same part? Thats a daunting task'),
  ('Shop Practices & General Notes', 'The difference between being successful and not is if you give up'),
  ('Shop Practices & General Notes', 'Dont blame others for anything, you should always be able to accommodate for whatever the situation'),
  ('Shop Practices & General Notes', 'Try and get work ready for second shift'),
  ('Shop Practices & General Notes', 'Balance properly plan ahead'),
  ('Shop Practices & General Notes', 'Get it Right the first time'),
  ('Materials - Plastic', 'Plastic rough 8k and 60'),
  ('Inspection & Quality', 'Look for extra parts when plated'),
  ('Shop Practices & General Notes', 'Keep asking for programs'),
  ('Endmills & Milling', 'Gullet'),
  ('Open Questions / To Follow Up', 'V7'),
  ('Materials - Plastic', 'For plastic half speed and double the feed'),
  ('Materials - Steel & Stainless', 'Sst use 25% diameter for peck'),
  ('Fixturing & Workholding', 'Make sure repeat jaws are flat'),
  ('Materials - Plastic', 'Plastic 6500 and 10 for finish hi tol'),
  ('Open Questions / To Follow Up', 'G81 g82?'),
  ('Open Questions / To Follow Up', '2fl em for?'),
  ('Drilling', 'Bigger drill turn the rpm up and feed from 15 and 2500'),
  ('Materials - Plastic', 'Plastic finishing speeds 10 and 4000'),
  ('Materials - Aluminum', 'Al finishing small em speeds 10 and 4800'),
  ('Speeds & Feeds', '10ka nd 300f for dynamic'),
  ('Speeds & Feeds', '10k and 80 for contours'),
  ('Inspection & Quality', 'Tool pressure tool engagement oO'),
  ('Endmills & Milling', 'Lighter cuts going fast'),
  ('G-Code & M-Code Reference', 'G1 and g2 and g3'),
  ('MasterCam / Gibbs Software Notes', 'Open print in internet explorer to edit, right click to draw on it'),
  ('G-Code & M-Code Reference', 'I and J move'),
  ('Inspection & Quality', 'Check radius on the cmm, best way to do that'),
  ('Endmills & Milling', 'Vapor lock is when spindle has been running really fast for awhile and it yeah'),
  ('Endmills & Milling', 'Dual contact spindle, makes it more rigid and accurate, worse if the machine crashes, Doosan 5 axis have it'),
  ('Materials - Steel & Stainless', '5-8 coolant for al and 10-12 for sst coolant'),
  ('Reaming', 'Cutting off end of reamer for dowel pin'),
  ('Open Questions / To Follow Up', 'Deltronics pin'),
  ('Inspection & Quality', 'Align part on cmm'),
  ('Fixturing & Workholding', 'Always do 3 clicks for fixtures so you dont have to skim it everytime'),
  ('Fixturing & Workholding', 'You want a plate to be as flat as possible otherwise other dimensions might be out'),
  ('Endmills & Milling', 'Indexable means you can put inserts in it'),
  ('Materials - Steel & Stainless', 'A36 1018 404 carbon steel'),
  ('Facemilling', 'Yellow chips from facemill probably smearing or something'),
  ('MasterCam / Gibbs Software Notes', 'On Mori m195 should be home'),
  ('MasterCam / Gibbs Software Notes', 'Touch off an offset tool, T20; M196 b5.5 x1.0 y-.5'),
  ('Open Questions / To Follow Up', 'Chip color ask dad and what chip look like'),
  ('Open Questions / To Follow Up', 'G55 M152??'),
  ('Reaming', 'Tall hole will want to use a reamer'),
  ('Endmills & Milling', 'If you are machining a deep bore and rerun an em try and add material, because it will take off more than you would like at the top and be oversized'),
  ('Inspection & Quality', 'When you are holding a high tolerance location use the same tool!'),
  ('Inspection & Quality', 'Also holding high tol hole location, do rough, rough, semi-finish, semi-finish, finish, finish'),
  ('Open Questions / To Follow Up', 'M195 ? m152 table home'),
  ('Materials - Steel & Stainless', 'Steel ½ dynamic 50 and 7500   1018  10% (.05)  at .625 depth'),
  ('Speeds & Feeds', 'More rpm more friction'),
  ('Materials - Plastic', 'Peek is a plastic'),
  ('Materials - Aluminum', 'Iridite is a coating not a plating that adds no material (cover wash)'),
  ('Materials - Plastic', 'Sometimes you will have to cheat the program numbers in the program, possibly with plastic'),
  ('Materials - Steel & Stainless', 'Can use a corner radius for steel so em doesn''t chip as fast'),
  ('Materials - Plastic', 'If you are getting chipping on small parts or plastic then put the pressure of the tool against the jaw instead by cutting front to back instead of side to side'),
  ('Shop Practices & General Notes', 'Always hold as much of the part as you can'),
  ('MasterCam / Gibbs Software Notes', 'In mastercam if you have the wear turned off it will follow the center line of the tool useful in some situations'),
  ('Materials - Plastic', 'Lower tool pressure to avoid chipping on plastic'),
  ('Tapping', 'When tapping into the part and it taps the jaws as well it will lift the part up'),
  ('MasterCam / Gibbs Software Notes', 'Might have to just update the toolpath in Gibbs if it is loading weird'),
  ('Tapping', 'Make sure drill and tap wont go through and hit the parallels or anything like that'),
  ('Inspection & Quality', 'Sometimes can have high tol holes undersized if we are assembling and press fitting'),
  ('Materials - Plastic', 'Plastic can melt if RPM is too high'),
  ('Materials - Aluminum', 'Higher RPM creates more friction, why you want it lower with steel and AL'),
  ('Materials - Plastic', 'Using an em on high tol hole for plastic can cause a tapper'),
  ('Materials - Plastic', 'When running plastic use an in/lb torque handle to hold onto part especially high tol'),
  ('Inspection & Quality', 'Always check chamfer and make sure it lines up, if it doesnt something is off'),
  ('Inspection & Quality', 'Always check 2x hole locations'),
  ('Shop Practices & General Notes', 'If something seems off it probably is!'),
  ('Inspection & Quality', 'Triple check tools before putting them in'),
  ('Shop Practices & General Notes', 'Look and see what all your tools are doing before doing program, S&F , should not need a setup sheet'),
  ('Materials - Steel & Stainless', 'Probably shouldnt be clamping stainless steel with kleet jaws lol'),
  ('Shop Practices & General Notes', 'Prototypes change!'),
  ('Reaming', 'If you have to clock it for the second op,you may want to use a reamer on a hole for the first side the part is right on everytime'),
  ('Shop Practices & General Notes', 'If there are set screws in a part, or something movable, take them out before running the part'),
  ('Tapping', 'Tap burning machine, edmund Graphite'),
  ('Tapping', 'To get broken tap outof fixture you can hit it with a punch, try to pick it out. And brake it up, use air gun,'),
  ('Tapping', 'If thread guage  isnt running smooth or true, try putting a bolt it and tapping it lightly with hammer'),
  ('Tapping', 'Checking runnout on the speroni check and tap while holding in hand lightly with hammer, vision corner is opposite side of corner being checked, remember that'),
  ('Reaming', 'A reamer within maybe max .0004 is good!'),
  ('Reaming', 'A reamer should be half the speed and double the feed of a drill'),
  ('Inspection & Quality', 'Make sure that if it looks like it is on center that it is actually on center'),
  ('Drilling', 'Dont need to spot for circuit board drill and carbide'),
  ('General Math & Formulas', '3,17 is essentially 3.17mm so just take 3.17/25.4 = standard'),
  ('Inspection & Quality', 'When indicating you could just go G0 G90 X0 Y0 G55'),
  ('Endmills & Milling', 'Spiral down hole for rough and finish with a small em!!'),
  ('GD&T', 'Always put stop against datum'),
  ('Endmills & Milling', 'When using a solid holder, you really only need to make a flat on the endmill when its taking a bigger cut using atleast a ½ em, more tool pressure'),
  ('Drilling', 'Continue to mess with speed and feed! If its a high tol hole, maybe slow down feed, if your drilling with a lot of chips decrease peck value, increase f and as'),
  ('Speeds & Feeds', 'Rough and finish for small hole, 1800 and 3 then 4800 and 10'),
  ('Fixturing & Workholding', 'Clamp atleast 50% of the part, dont let it hang out a bunch , especially if it is a tall part, when a tall part, put stop closest to the top of part or plane'),
  ('Tapping', 'Make sure tap is not pressing into part, make sure it is relieved'),
  ('Materials - Plastic', 'Chips can gum up on spiral tap when tapping plastic causing the hole to be larger, because there is a lot of extra space on the tap for chips to bind up on'),
  ('Materials - Plastic', 'Make sure all your tools are rigid as possible, especially in plastic, do not clamp your plastic too much it might expand after machining'),
  ('Materials - Plastic', 'Drilling in plastic if you bunch up a lot of chips it will expand the plastic'),
  ('Drilling', 'Stringy chips? Increase F and reduce peck should be the same with any material'),
  ('Fixturing & Workholding', 'Always be careful of clamping pressure'),
  ('Drilling', 'Dont be afraid to indicate a drill'),
  ('Shop Practices & General Notes', 'Make everything as rigid as possible'),
  ('Materials - Plastic', 'Never use form tap on plastic'),
  ('Tapping', 'When tapping into jaws it can bring the part up'),
  ('Tapping', 'Make sure you have clearance for the tap hole in the jaws first!'),
  ('Materials - Aluminum', 'Always check for after anodizing'),
  ('Fixturing & Workholding', 'Machine Y+ and Y- with face to put the pressure into the jaws not the part, used on triangle part'),
  ('MasterCam / Gibbs Software Notes', 'Update each toolpath in gibbs'),
  ('Materials - Aluminum', 'Make sure before if drill and tap are going through that it is al jaws your using'),
  ('Inspection & Quality', 'When doing a small hi tol hole it may be okay to be a little undersized because it is getting a press fit'),
  ('Materials - Plastic', 'Plastic can melt if RPM of F to high'),
  ('Materials - Plastic', 'Using an EM on plastic High Tol hole may cause taper, reamer would be better'),
  ('Materials - Plastic', 'Plastic always want to use inch/lb torque never want to over tighten with high tol for plastic'),
  ('Inspection & Quality', 'If you have a high tol cb depth, make sure to use the same endmill for the surface as well because it will be right on the,. Machine it to itself'),
  ('Materials - Plastic', 'Plastic you should use spiral flute,'),
  ('Drilling', 'Always make sure to use a spiral flute when doing a blind hole'),
  ('Materials - Plastic', 'Always use kleet jaws for plastic'),
  ('Threads & Tap Sizing', 'Gh3 or h3 is nominal can use a h2 if you want, the bigger h numbers are for if the part is getting plated'),
  ('Fixturing & Workholding', 'When loading a tall part and using tall jaws, you may want to use parallels or shim stock  in the top of the jaws to press against the top of the part'),
  ('Tapping', 'Not a bad idea to just check drilled holes before tapping'),
  ('Tapping', 'H5 or a value like that can expand your minor of a tap hole to be too big, may want to switch over to cut tap if applicable to hold tolerance'),
  ('Tapping', 'Sometimes cut taps can hold tolerance better supposamente'),
  ('Shop Practices & General Notes', 'Learning Sequentally'),
  ('Endmills & Milling', 'Use radius mill to rough'),
  ('Fixturing & Workholding', 'When setting up a fixture, make sure that holes and stuff will line up, make sure its the right fixture'),
  ('Reaming', 'Reamer can be tapered, if it is tapering your hole, and your pin is only going so deep, try lowering your reamer, because it may be tapered quite a bit and its only cutting to the right size on the top of the reamer'),
  ('Drilling', 'If you made the hole too big you can use a bearing ball and hammer it,, orrr'),
  ('Drilling', 'You can score it, coming up out of the hole with three strong scores then push the go pin in'),
  ('Reaming', 'Reamer should be half the speed and double the feed of a drill'),
  ('Shop Practices & General Notes', 'If there are set screws or something applicable in the part, make sure to take it out before machining'),
  ('Materials - Aluminum', 'Want to use kleet jaws for al stock piece, so part does not rip out, and holds better more accurate'),
  ('Shop Practices & General Notes', 'Hold on to as much of the part as possible'),
  ('Materials - Steel & Stainless', '17 - 4 SST, GOOD FOR HARDENING, USED IN AEROSPACE AND MEDICAL, HARDER, AND EASIER TO STAIN, ROCKWELL?'),
  ('Materials - Steel & Stainless', '303 AND 304 SST'),
  ('Materials - Steel & Stainless', 'NO SST IS ACTUALLY NON STAINABLE'),
  ('Materials - Steel & Stainless', 'SST IS MAINLY JSUT STAIN RESISTANT, JUST LIKE NO SUCH THING AS BULLETPROOF'),
  ('Tapping', 'BASIC TAP FEED RATE LOW 250, GO UP AS SIZWE GOES UP'),
  ('Materials - Steel & Stainless', 'FINISH PASSIVATE PER ASTM-A-967-05, CRITIC 3 , IS A FINISH THAT JUST ESSENTIALLY CLEANS THE PART AND FILLS IN OR CLEANS POURS. IT DOES NOT ADD ANY MATERIAL'),
  ('Inspection & Quality', 'Rc IS ROCKWELL'),
  ('Endmills & Milling', 'FOR DOING A CIRCLE DEPTH TAKE STEPS DOWN'),
  ('Materials - Aluminum', 'RULE OF THUMB WITH AL REAMING A HOLE AROUND .375 LEAVE ABOUT 2% FOR THE REAMER (x.02)TOTAL, IF ITS SMALLER THAN LIKE A 1/4 LEAVE .002-.003 TOTAL'),
  ('Materials - Steel & Stainless', '1018 CRS'),
  ('Materials - Plastic', '4-40 CUT .089 #43 DRILL (PLASTIC #43 .086?)'),
  ('Drilling', '4-40 ROLL SHOULD BE #39 .0995 DRILL'),
  ('Materials - Plastic', 'ACETAL IS A HARD WHITE PLASTIC'),
  ('Materials - Steel & Stainless', 'A36 STEEL SHOULD NOT BOW'),
  ('Materials - Steel & Stainless', 'BUT 1018 WILL BOW'),
  ('Materials - Steel & Stainless', 'WONT GET ORANG CHIPS WITH STANDARD 1018 OR A36 OR COMMON THINGS WE USE I GUESS'),
  ('Materials - Steel & Stainless', 'A36----'),
  ('Materials - Steel & Stainless', '2200 AND 18 FULL DEPTH ONLY ONE FINISH WITH .5 FOR A36 STEEL ROUGHLY .08 RDOC FOR EM'),
  ('Speeds & Feeds', '650 RPM AND 30F FOR FACE MILL WITH COOLANT ON, COULD BE OFF?'),
  ('Speeds & Feeds', '.06 AXIAL DOC'),
  ('Materials - Steel & Stainless', 'A36 STEEL VS 1018?'),
  ('Tapping', 'FORM TAPS EASILY NEED AN EXTRA .125 DEPTH TO GE TO THE FULL THREAD'),
  ('Threads & Tap Sizing', '6-32, JUST TAKE 1/32 AND YOU WILL GET YOUR THREAD PITCH'),
  ('Tapping', 'ALWAYS ADD .015 CHAMFER TO EACH SIDE OF TAP'),
  ('Drilling', 'DO THE MATH FOR DRILL AND BASICS SPEEDS!!'),
  ('Tapping', 'Learn the s and f common for drills and taps, and memorize equations'),
  ('Drilling', 'g81/g82 when changed need to add a peck amount which is?'),
  ('Speeds & Feeds', 'Chatter from rpm too fast never from feed to fast'),
  ('Speeds & Feeds', 'Just do mathe for spindle, even if it is 10% lower it is enough to make a difference, one time going from 10000 rpm to 9000 rpm fixed my issue'),
  ('Fixturing & Workholding', 'That one part had to line up the flat side with the flat side of jaws, as long as your edge lines up flat to get your exact locations at'),
  ('G-Code & M-Code Reference', 'G40 has to be on the lead in or lead out move , good idea to adjust in the program'),
  ('Endmills & Milling', 'Big passes and deep cuts with dynamic, part will need pocket, otherwise can pull up'),
  ('Endmills & Milling', 'When using a CS make sure to use the exact diameter called out in the program because tip to desired diameter will be different based on size'),
  ('Fixturing & Workholding', 'You can try to make a pocket smaller if its a circle to be able to reuse the jaws for something else later'),
  ('Fixturing & Workholding', 'Took apart vise and cleaned so I could have less resistance, and use less clamping force,'),
  ('Materials - Plastic', 'Hold plastic very lightly otherwise can bow'),
  ('Endmills & Milling', 'Router em,'),
  ('Materials - Plastic', 'Try using a face mill with only one insert in it, preferably a sheer hog, new insert, going F of 5 with 10,000 for a special finish, plastic or al'),
  ('Materials - Plastic', 'Plastic with stuff in it can be hard to get a specific finish on'),
  ('Fixturing & Workholding', 'On vacuum, start em at strongest vacuum point, do multiple passes, rough, rough, semi finihs, semi finish, finish finish'),
  ('Fixturing & Workholding', 'To make sure part didnt move in vacuum check locations with indicator g0g90xy ,'),
  ('Speeds & Feeds', 'Long em chatter, bring rpm down'),
  ('Speeds & Feeds', 'Slow down rpm for long tools otherwise will chatter'),
  ('Open Questions / To Follow Up', 'What is honing'),
  ('Threads & Tap Sizing', 'Thread mill 6500 and 20'),
  ('Speeds & Feeds', 'Port tool 1000 and 4'),
  ('Tapping', 'Tapered em, number displayed is per side'),
  ('Tapping', 'Check depth of drill and dia before tapping always'),
  ('Inspection & Quality', 'Grind off bolt to check depth'),
  ('Open Questions / To Follow Up', 'Unjf and all those different from eachother'),
  ('Materials - Aluminum', 'Al rough 7500 and 120?'),
  ('Open Questions / To Follow Up', 'Cs depth calculator'),
  ('Open Questions / To Follow Up', 'Trig to learn cs depth'),
  ('Shop Practices & General Notes', '¾-16'),
  ('Endmills & Milling', 'Make sure pocket and radius is large enough, its okay for pocket to be oversized, if not it will push the part up for sure'),
  ('Endmills & Milling', 'When making a pocket, check multiple parts to make sure that all the parts fit'),
  ('Fixturing & Workholding', 'Hang odd sized part off side of the jaws, like a big L'),
  ('Open Questions / To Follow Up', '???????????how to consider CS dia and depth'),
  ('Open Questions / To Follow Up', 'Trig???tip size math for chamfer mill'),
  ('Tapping', 'Chip break tap?'),
  ('Tapping', 'Spiral point tap?'),
  ('Speeds & Feeds', '!!!!72 and 2200 indexed em about ½ or inch no coolant pha used on big i think SS part'),
  ('Speeds & Feeds', 'SS part pha used 950 and 20 with coolant, perfect finish'),
  ('Open Questions / To Follow Up', 'How to determine depth for NPT thread?'),
  ('Threads & Tap Sizing', 'Insert thread mill with N on it possibly stands for NPT'),
  ('Tapping', 'Bottoming tap'),
  ('Tapping', 'Bottoming tap may make hole slightly bigger creating more pressure'),
  ('Materials - Steel & Stainless', '1018 1000 and 4? With face, .09 depth'),
  ('Endmills & Milling', 'Possibly try to spiral down for finish with certain materials'),
  ('Materials - Aluminum', 'Face 6500 and 40 for al, beautiful'),
  ('Fixturing & Workholding', 'Saw cut material may not sit straight, might want to cut .01 off of each side to release pressure'),
  ('Shop Practices & General Notes', '¾-16 using .495 treadmill'),
  ('Speeds & Feeds', 'Port tool, measure end of port tool for called out dimensions'),
  ('Inspection & Quality', 'Read sides of tool for exact size'),
  ('Open Questions / To Follow Up', 'Major - pitch = minor? No i dont think so'),
  ('Tapping', 'For getting the minor diameter of a drill or tap, like 10-24 you want to start at .06 for the 0, then everyone you add is +.013'),
  ('Threads & Tap Sizing', 'Example 10-24 the minor is .013'),
  ('Speeds & Feeds', 'Chip load: hard steel 2-3, mild 5, Al 6-8'),
  ('G-Code & M-Code Reference', 'Homing: g0 g90 g53 x-5.0'),
  ('Open Questions / To Follow Up', 'Doing surfacing'),
  ('Tapping', 'Using a tapping block, just start slow, or even tapping with the tapomatic thing'),
  ('Tapping', 'If you spot full depth on a tap hole you could drive the burr up'),
  ('Open Questions / To Follow Up', 'D6 on gauge and h6 on tap tol for???'),
  ('Open Questions / To Follow Up', 'G82? G98? G81 pecking?'),
  ('Facemilling', '1/2 face mill ss 50 and 3000. 2 inch face 20 and 1000. Face finish 30 and 1500'),
  ('Tapping', 'Tapping: run it in the air to see if it looks right first if you''re not sure'),
  ('Threads & Tap Sizing', 'List of taps and drills: 2-56 cut #50 .07'),
  ('Open Questions / To Follow Up', '(x3) Parasolid, and dxf?'),
  ('MasterCam / Gibbs Software Notes', 'Gibbs always post good'),
  ('Open Questions / To Follow Up', 'G89? G94 G95'),
  ('Threads & Tap Sizing', 'Standard plug thread (topic to fill in)'),
  ('Threads & Tap Sizing', 'Metric plug thread (topic to fill in)'),
  ('Threads & Tap Sizing', 'Balax (tap brand)'),
  ('Threads & Tap Sizing', 'H3 (sometimes h2) nominal'),
  ('Open Questions / To Follow Up', 'H7 for plating means ground?'),
  ('Open Questions / To Follow Up', 'P? How wide the thread?'),
  ('General Math & Formulas', 'The circumference of a circle is always 3.14 times greater than the diameter'),
  ('Materials - Aluminum', '6061 aluminum is wrought alloy. 800-1500 SFM. Wrought meaning it can be rolled, forged, or extruded. 97.9% AL, 0.6% silicone, 1.0% magnesium, 0.2% chromium, 0.28% copper. Corrosion resistance. Weldable.'),
  ('GD&T', 'Leading dimensions from datum'),
  ('GD&T', 'Diametrical / radial (tolerance zone types)'),
  ('Endmills & Milling', 'Thicker em for smaller hole'),
  ('Materials - Aluminum', 'Hard anodize +.002 w/ 50% penetration so that = +.001 each side'),
  ('Materials - Plastic', 'Use cut tap on plastic. Plastic will bow.'),
  ('Materials - Steel & Stainless', 'SST: peck drill 25% of diameter. 1/2 face mill ss 50 and 3000. Better finish on steel when using an em to face. Big drill use carbide and 6.5 with 800, maybe even 2 and 550'),
  ('Materials - Aluminum', 'Al: 180 and 10000 rough dynamic 1/2 em'),
  ('Materials - Aluminum', '6105 and 180 face on al'),
  ('Speeds & Feeds', '600 and 800 sfm'),
  ('Facemilling', 'Sfm face mill 4800'),
  ('Drilling', 'Spot 20 and 8000'),
  ('Drilling', '3.1mm and number 38 drill 12.6 4800'),
  ('Endmills & Milling', '1/4, 200 and 10000 dynamic'),
  ('Materials - Plastic', 'Plastic: you can use a brand new em for high tol hole but it will most likely taper, reamer may be best. Use very light clamping force, even just by hand until it stops, on certain parts.'),
  ('G-Code & M-Code Reference', 'MasterCam G-codes: G1 linear, G2 arc, G3 reverse arc'),
  ('G-Code & M-Code Reference', 'Canned cycle reference: G81 drill cycle, G82 dwell cycle, G83 peck (Z Q(peck) R F), G84 tap, G85 bore'),
  ('G-Code & M-Code Reference', 'G73 chip break cycle, if .03 rapid peck cycle'),
  ('Open Questions / To Follow Up', 'Going to need a Z F R (canned cycle needs these)'),
  ('Threads & Tap Sizing', 'M4x.7 is 4mm. 60/2 depth.'),
  ('Drilling', '1/2 and 1/3 unless carbide, for peck amounts'),
  ('MasterCam / Gibbs Software Notes', 'MasterCam: transform - offset - chains. Centerline flowline. Copy over the job from 5 axis.'),
  ('MasterCam / Gibbs Software Notes', 'GibbsCam GD&T. Copy over the job from 5 axis.'),
  ('Endmills & Milling', 'Corner Radius: CR, cr, CREM, Corner Rounding, Radius tool, crem'),
  ('Endmills & Milling', 'If the tool is really small, you may want to indicate it in - typically it will be close to the theoretical cutting point. So if there is a step, trust on this: move the tool away from the part and then down. Move away from the part until the step goes away, then move down until it starts cutting - do these in small increments, a couple tenths or a thou at a time. Once it starts cutting it will really start cutting.'),
  ('GD&T', 'GD&T: Profile of a surface - same surface has A and B datums and has a tolerance to hold, pretty much saying no taper'),
  ('Threads & Tap Sizing', 'Checking NPT threads: start with the minor gauge. B and BT is nominal. If it says plus 1 rev, it will be between MX and MXT; if minus 1 revolution, MN and MNT. ANPT is the same thing as NPT, just used for checking minor gauge. When measuring minor gauge: if you go down .001 that is equal to going -.016 (may only be for the 1/4 NPT). When using insert NPT it should say the size of the radius, from the center to the end.'),
  ('Threads & Tap Sizing', 'For thread milling, you just need the diameter of the tool and make sure the TPI is correct'),
  ('Threads & Tap Sizing', 'h1 = .0005 (H X .0005)'),
  ('Threads & Tap Sizing', 'To find the MAJOR size for the tap (not the drill size, just the measurement): it is 0 at .06 (0-56), then every number you add is +.013. Example: 10-32, 0 starts at .06, then add .013x10 = .190. Major of 10-32 is .190'),
  ('Threads & Tap Sizing', 'CUT TAP: MINOR = major - pitch (drill size). Theoretically the minor should be the drill size.'),
  ('Threads & Tap Sizing', 'FORM TAP: MAJOR size before form tap (hole size or drill size before tapping) = 1/2 of pitch - (H X .0005) - major. Turn into positive number. (ex: 10-24 is .17167)');

create or replace function search_shop_notes(search_query text, match_limit int default 8)
returns table(note_category text, content text) as $$
  select sn.category, sn.content
  from shop_notes sn,
       to_tsquery('english', replace(plainto_tsquery('english', search_query)::text, ' & ', ' | ')) as q
  where to_tsvector('english', sn.content) @@ q
  order by ts_rank(to_tsvector('english', sn.content), q) desc
  limit match_limit;
$$ language sql stable;

grant execute on function search_shop_notes(text, int) to anon;