import { useState, useMemo } from "react";

// General starting points for a carbide end mill in milling — not gospel.
// Always check your tool manufacturer's chart and adjust for rigidity,
// coolant, and tool condition.
const MATERIALS = {
  "Aluminum (6061)": { sfm: 600, ipt: 0.003 },
  "Mild Steel (1018)": { sfm: 350, ipt: 0.002 },
  "Stainless Steel (304)": { sfm: 150, ipt: 0.0015 },
  "Cast Iron": { sfm: 300, ipt: 0.003 },
  "Brass": { sfm: 500, ipt: 0.003 },
  "Tool Steel (hardened)": { sfm: 100, ipt: 0.0015 },
  "Titanium": { sfm: 80, ipt: 0.0015 },
  "Delrin / Acetal (plastic)": { sfm: 500, ipt: 0.004 },
};

export default function SpeedFeedTab() {
  const [diameter, setDiameter] = useState(0.5);
  const [flutes, setFlutes] = useState(2);
  const [material, setMaterial] = useState("Aluminum (6061)");
  const [sfm, setSfm] = useState(MATERIALS["Aluminum (6061)"].sfm);
  const [ipt, setIpt] = useState(MATERIALS["Aluminum (6061)"].ipt);

  function handleMaterialChange(name) {
    setMaterial(name);
    setSfm(MATERIALS[name].sfm);
    setIpt(MATERIALS[name].ipt);
  }

  const rpm = useMemo(() => {
    const d = parseFloat(diameter);
    const s = parseFloat(sfm);
    if (!d || !s) return 0;
    return (s * 3.82) / d;
  }, [diameter, sfm]);

  const ipm = useMemo(() => {
    const f = parseFloat(flutes);
    const i = parseFloat(ipt);
    if (!rpm || !f || !i) return 0;
    return rpm * i * f;
  }, [rpm, flutes, ipt]);

  const inputStyle = {
    width: "100%",
    padding: 8,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
    boxSizing: "border-box",
  };
  const labelStyle = { display: "block", fontSize: 13, color: "#666", marginBottom: 4, marginTop: 12 };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>Speed & Feed Calculator</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Milling only, for now. Material presets are general starting points — adjust as needed.
      </p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 280px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Inputs</h3>

          <label style={labelStyle}>Material</label>
          <select value={material} onChange={(e) => handleMaterialChange(e.target.value)} style={inputStyle}>
            {Object.keys(MATERIALS).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>

          <label style={labelStyle}>Tool Diameter (in)</label>
          <input type="number" step="0.001" value={diameter} onChange={(e) => setDiameter(e.target.value)} style={inputStyle} />

          <label style={labelStyle}>Number of Flutes</label>
          <input type="number" step="1" value={flutes} onChange={(e) => setFlutes(e.target.value)} style={inputStyle} />

          <label style={labelStyle}>Cutting Speed — SFM</label>
          <input type="number" step="1" value={sfm} onChange={(e) => setSfm(e.target.value)} style={inputStyle} />

          <label style={labelStyle}>Chip Load per Tooth — IPT (in)</label>
          <input type="number" step="0.0001" value={ipt} onChange={(e) => setIpt(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ flex: "1 1 220px", background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Results</h3>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#666" }}>Spindle Speed</div>
            <div style={{ fontSize: 28, fontWeight: "bold", color: "#1e3a8a" }}>{rpm ? rpm.toFixed(0) : "—"} RPM</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#666" }}>Feed Rate</div>
            <div style={{ fontSize: 28, fontWeight: "bold", color: "#16a34a" }}>{ipm ? ipm.toFixed(2) : "—"} IPM</div>
          </div>
        </div>
      </div>
    </div>
  );
}
