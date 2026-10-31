const EQUATIONS = [
  {
    name: "SFM → RPM",
    formula: "RPM = (SFM × 3.82) / Diameter",
    plain: "Converts a recommended cutting speed (SFM) into the spindle RPM for a given tool diameter.",
    example: "A 0.5\" end mill at 400 SFM: RPM = (400 × 3.82) / 0.5 = 3,056 RPM.",
  },
  {
    name: "RPM → SFM",
    formula: "SFM = (RPM × Diameter) / 3.82",
    plain: "The reverse of the above — figure out what surface speed you're actually running at a given RPM.",
    example: "A 0.75\" tool running at 3,000 RPM: SFM = (3,000 × 0.75) / 3.82 ≈ 589 SFM.",
  },
  {
    name: "Feed Rate (IPM)",
    formula: "IPM = RPM × IPT × Number of Flutes",
    plain: "How fast the table/tool moves in inches per minute, based on spindle speed, chip load, and flute count.",
    example: "3,056 RPM, 0.003\" chip load, 2 flutes: IPM = 3,056 × 0.003 × 2 ≈ 18.3 IPM.",
  },
  {
    name: "Chip Load (IPT)",
    formula: "IPT = IPM / (RPM × Number of Flutes)",
    plain: "Backs out the actual chip load per tooth from a feed rate you're running — useful for checking if a feed is reasonable.",
    example: "Running 20 IPM at 3,000 RPM with 2 flutes: IPT = 20 / (3,000 × 2) ≈ 0.0033\".",
  },
  {
    name: "Cutting Speed (Metric)",
    formula: "Vc (m/min) = (π × Diameter(mm) × RPM) / 1000",
    plain: "The metric version of SFM — surface speed in meters per minute.",
    example: "A 12mm end mill at 4,000 RPM: Vc = (3.1416 × 12 × 4,000) / 1000 ≈ 150.8 m/min.",
  },
  {
    name: "RPM (Metric)",
    formula: "RPM = (Vc × 1000) / (π × Diameter(mm))",
    plain: "Reverse of the metric cutting speed equation — RPM from a target Vc.",
    example: "Target 150 m/min on a 12mm tool: RPM = (150 × 1000) / (3.1416 × 12) ≈ 3,979 RPM.",
  },
  {
    name: "Metal Removal Rate (MRR)",
    formula: "MRR (in³/min) = Width of Cut × Depth of Cut × Feed Rate (IPM)",
    plain: "How much material volume you're removing per minute — a general gauge of how aggressive a cut is.",
    example: "0.5\" wide, 0.25\" deep, 20 IPM: MRR = 0.5 × 0.25 × 20 = 2.5 in³/min.",
  },
];

function EquationCard({ eq }) {
  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 12 }}>
      <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{eq.name}</h3>
      <div
        style={{
          fontFamily: "ui-monospace, Consolas, monospace",
          background: "#f4f3ec",
          padding: "8px 12px",
          borderRadius: 6,
          marginBottom: 8,
          fontSize: 14,
        }}
      >
        {eq.formula}
      </div>
      <p style={{ margin: "0 0 6px", fontSize: 14, color: "#444" }}>{eq.plain}</p>
      <p style={{ margin: 0, fontSize: 13, color: "#999" }}>Example: {eq.example}</p>
    </div>
  );
}

export default function EquationsTab() {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>Milling Equations</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Core formulas for figuring SFM, RPM, feed rate, and chip load. Variables use inches unless noted.
      </p>
      {EQUATIONS.map((eq) => (
        <EquationCard key={eq.name} eq={eq} />
      ))}
    </div>
  );
}
