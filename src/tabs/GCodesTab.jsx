// Common milling G-codes (FANUC-style). A core set is highly standard, but
// always verify against your specific control's manual — behavior can vary.
const GCODES = [
  { code: "G00", def: "Rapid positioning — moves at the machine's max traverse rate, not a programmed feed.", ex: "Moving the tool quickly to a start point above the part, with no cutting happening." },
  { code: "G01", def: "Linear interpolation — moves in a straight line at the programmed feed rate.", ex: "The workhorse code for actually cutting a straight edge or wall." },
  { code: "G02", def: "Circular interpolation, clockwise.", ex: "Cutting a clockwise arc or circle, like rounding a corner." },
  { code: "G03", def: "Circular interpolation, counter-clockwise.", ex: "Cutting the other half of a circular pocket." },
  { code: "G04", def: "Dwell — pauses motion for a specified amount of time.", ex: "G04 P1000 pauses 1 second, sometimes used to let a drill clear chips at the bottom of a hole." },
  { code: "G17", def: "Selects the XY plane for circular interpolation and cutter compensation.", ex: "The default plane for almost all standard milling operations." },
  { code: "G20 / G21", def: "Sets programming units to inches (G20) or millimeters (G21).", ex: "Needs to match whatever units your program's numbers are written in, or everything will be scaled wrong." },
  { code: "G28", def: "Returns the machine to its reference (home) position.", ex: "Commonly run before a tool change so the tool changer has clearance." },
  { code: "G40", def: "Cancels cutter diameter compensation.", ex: "Turns off any left/right offset so the tool follows the programmed line exactly." },
  { code: "G41 / G42", def: "Applies cutter compensation to the left (G41) or right (G42) of the programmed path.", ex: "Lets you program the actual part outline and have the control offset for tool radius automatically." },
  { code: "G43", def: "Turns on tool length compensation using the offset for the active tool (H number).", ex: "G43 H1 tells the control to add tool #1's length offset so Z moves land where expected." },
  { code: "G49", def: "Cancels tool length compensation.", ex: "Used at the end of a program or before a move where the offset shouldn't apply." },
  { code: "G54–G59", def: "Selects one of six work coordinate systems (fixture offsets).", ex: "G54 for vise position 1, G55 for vise position 2 — same program, different zero points." },
  { code: "G80", def: "Cancels any active canned cycle (like drilling or tapping cycles).", ex: "Called after a series of G81 drilling cycles so the next move doesn't repeat the cycle." },
  { code: "G90 / G91", def: "Positioning mode: absolute from part zero (G90) or incremental from the last position (G91).", ex: "G90 is used for almost everything; G91 is handy for a repeated pattern of equally spaced holes." },
  { code: "G94 / G95", def: "Feed mode: per-minute (G94) or per-revolution (G95).", ex: "G94 is standard for milling; G95 ties feed directly to spindle RPM, which matters more in turning." },
  { code: "G98 / G99", def: "In a canned cycle, returns to the initial Z height (G98) or the R-plane height (G99) between repeats.", ex: "G99 is faster between holes on a clear part; G98 is safer when there's an obstacle like a clamp." },
];

export default function GCodesTab() {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>G-Codes</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Common milling G-codes. Core set is standard, but always check your specific control's manual.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {GCODES.map((g) => (
          <div key={g.code} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
              <span
                style={{
                  fontFamily: "ui-monospace, Consolas, monospace",
                  background: "#eff6ff",
                  color: "#2563eb",
                  padding: "2px 10px",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: "bold",
                }}
              >
                {g.code}
              </span>
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 14, color: "#333" }}>{g.def}</p>
            <p style={{ margin: 0, fontSize: 13, color: "#999" }}>Example: {g.ex}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
