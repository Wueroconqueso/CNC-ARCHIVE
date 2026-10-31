// Common milling M-codes (FANUC-style). A core set is highly standard, but
// always verify against your specific control's manual — behavior can vary.
const MCODES = [
  { code: "M00", def: "Program stop — halts execution, spindle, and coolant until cycle start is pressed again.", ex: "Used mid-program to check a part or make an adjustment before continuing." },
  { code: "M01", def: "Optional stop — like M00, but only pauses if the optional stop switch is turned on.", ex: "Handy for checking the first part off a new program without needing it on every run after that." },
  { code: "M02", def: "End of program — stops the program; does not rewind or reset modal states.", ex: "Marks the very end of a simple program that won't run again immediately." },
  { code: "M03", def: "Spindle on, clockwise rotation.", ex: "Standard direction for the vast majority of right-hand cutting tools in milling." },
  { code: "M04", def: "Spindle on, counter-clockwise rotation.", ex: "Used for left-hand cutting tools, or specific tapping/threading operations." },
  { code: "M05", def: "Spindle stop.", ex: "Called before a tool change or at the end of a program." },
  { code: "M06", def: "Tool change — swaps to the tool number specified by the T word.", ex: "M06 T5 tells the machine to load tool #5 from the carousel." },
  { code: "M08", def: "Coolant on (flood coolant).", ex: "Turned on before engaging a cut in materials that generate heat, like steel." },
  { code: "M09", def: "Coolant off.", ex: "Called before a tool change or at the end of the program." },
  { code: "M30", def: "End of program and reset — stops and rewinds to the beginning, resetting modal conditions.", ex: "Used at the end of a production program that will be run again and again." },
  { code: "M48", def: "Enables feedrate/spindle speed override controls.", ex: "Restores manual override control after it's been locked out by M49." },
  { code: "M49", def: "Disables feedrate/spindle speed override controls, forcing programmed values.", ex: "Used where overriding the feed could cause a crash or a bad part." },
  { code: "M98", def: "Calls a subprogram.", ex: "M98 P1000 runs subprogram O1000 — useful for repeating the same pocket or drilling pattern in multiple places." },
  { code: "M99", def: "Returns from a subprogram back to the calling program.", ex: "Placed at the end of the subprogram so control passes back to where it left off." },
];

export default function MCodesTab() {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>M-Codes</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Common milling M-codes. Core set is standard, but always check your specific control's manual.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {MCODES.map((m) => (
          <div key={m.code} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
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
                {m.code}
              </span>
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 14, color: "#333" }}>{m.def}</p>
            <p style={{ margin: 0, fontSize: 13, color: "#999" }}>Example: {m.ex}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
