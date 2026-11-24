import { useMemo, useState } from "react";
import {
  WORKPIECE_MATERIALS,
  TOOL_MATERIALS,
  COATINGS,
  OPERATIONS,
  TOOL_PRESETS,
  nearestChartDiameter,
} from "../data/speedFeedData";
import { solveSpeedsAndFeeds, chipThinningFactor } from "../sfSolver";

const FRACTION_LABELS = {
  0.125: "1/8",
  0.1875: "3/16",
  0.25: "1/4",
  0.3125: "5/16",
  0.375: "3/8",
  0.5: "1/2",
  0.625: "5/8",
  0.75: "3/4",
  1: "1",
};

function numOrNull(s) {
  if (s === undefined || s === null || s === "") return null;
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

function fmt(n, digits = 0) {
  return n == null ? "" : n.toFixed(digits);
}

const inputStyle = {
  width: "100%",
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 14,
  boxSizing: "border-box",
};
const labelStyle = { display: "block", fontSize: 13, color: "#666", marginBottom: 4, marginTop: 12 };
const cardStyle = { flex: "1 1 280px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 };
const hintStyle = { fontSize: 12, color: "#888", marginTop: 4 };

export default function SpeedFeedTab() {
  const [presetId, setPresetId] = useState("custom");
  const [diameter, setDiameter] = useState("0.5");
  const [flutes, setFlutes] = useState("2");
  const [toolMaterial, setToolMaterial] = useState("Carbide");
  const [coating, setCoating] = useState("Uncoated");
  const [workpieceMaterial, setWorkpieceMaterial] = useState("Aluminum (6061 / wrought)");
  const [sfmInput, setSfmInput] = useState("");
  const [iptInput, setIptInput] = useState("");
  const [rpmInput, setRpmInput] = useState("");
  const [ipmInput, setIpmInput] = useState("");
  const [operation, setOperation] = useState("Slotting");
  const [rdoc, setRdoc] = useState("");
  const [adoc, setAdoc] = useState("");

  const preset = TOOL_PRESETS.find((p) => p.id === presetId) || TOOL_PRESETS[0];

  function handlePresetChange(id) {
    setPresetId(id);
    const p = TOOL_PRESETS.find((x) => x.id === id);
    if (!p) return;
    if (p.toolMaterial) setToolMaterial(p.toolMaterial);
    if (p.coating) setCoating(p.coating);
    if (p.flutes) setFlutes(String(p.flutes));
    if (p.workpieceMaterial) setWorkpieceMaterial(p.workpieceMaterial);
    if (p.operation) setOperation(p.operation);
  }

  // What SFM/IPT to suggest, given the current tool + material setup.
  const suggestion = useMemo(() => {
    const d = numOrNull(diameter);
    if (preset.chart) {
      const nearest = nearestChartDiameter(preset.chart, d || Object.keys(preset.chart).map(Number)[0]);
      const point = preset.chart[nearest];
      return {
        sfm: point.sfm,
        ipt: point.ipt,
        sfmRange: null,
        iptRange: null,
        note: `Exact published value for ${FRACTION_LABELS[nearest] || nearest}" dia — ${preset.source}`,
      };
    }
    const mat = WORKPIECE_MATERIALS[workpieceMaterial];
    const mult = TOOL_MATERIALS[toolMaterial].sfmMultiplier * COATINGS[coating].sfmMultiplier;
    const sfmRange = [mat.sfm[0] * mult, mat.sfm[1] * mult];
    const iptRange = mat.ipt;
    const note = preset.id !== "custom" && preset.source ? preset.source : null;
    return {
      sfm: (sfmRange[0] + sfmRange[1]) / 2,
      ipt: (iptRange[0] + iptRange[1]) / 2,
      sfmRange,
      iptRange,
      note,
    };
  }, [preset, diameter, workpieceMaterial, toolMaterial, coating]);

  const solved = useMemo(() => {
    const knowns = {
      diameter: numOrNull(diameter),
      flutes: numOrNull(flutes),
      sfm: numOrNull(sfmInput) ?? suggestion.sfm,
      rpm: numOrNull(rpmInput),
      ipt: numOrNull(iptInput) ?? suggestion.ipt,
      ipm: numOrNull(ipmInput),
    };
    return solveSpeedsAndFeeds(knowns);
  }, [diameter, flutes, sfmInput, rpmInput, iptInput, ipmInput, suggestion]);

  const opSuggestion = OPERATIONS[operation];
  const d = numOrNull(diameter);
  const rdocVal = numOrNull(rdoc);
  const adocVal = numOrNull(adoc);
  const thinningFactor = chipThinningFactor(rdocVal, d);
  const thinnedIpt = thinningFactor && solved.ipt != null ? solved.ipt * thinningFactor : null;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>Speed & Feed Calculator</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Fill in whatever you know — tool, material, or the numbers themselves — and it'll work out the rest.
        Everything here is a starting point; always sanity-check against the cut.
      </p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* TOOL CARD */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Tool</h3>

          <label style={labelStyle}>Common Tool Preset</label>
          <select value={presetId} onChange={(e) => handlePresetChange(e.target.value)} style={inputStyle}>
            {TOOL_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Tool Diameter (in)</label>
          <input type="number" step="0.001" value={diameter} onChange={(e) => setDiameter(e.target.value)} style={inputStyle} />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
            {Object.entries(FRACTION_LABELS).map(([dec, label]) => (
              <button
                key={dec}
                onClick={() => setDiameter(dec)}
                style={{
                  fontSize: 12,
                  padding: "3px 7px",
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <label style={labelStyle}>Number of Flutes</label>
          <input type="number" step="1" value={flutes} onChange={(e) => setFlutes(e.target.value)} style={inputStyle} />

          <label style={labelStyle}>Tool Material</label>
          <select value={toolMaterial} onChange={(e) => setToolMaterial(e.target.value)} style={inputStyle}>
            {Object.keys(TOOL_MATERIALS).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>

          <label style={labelStyle}>Tool Coating</label>
          <select value={coating} onChange={(e) => setCoating(e.target.value)} style={inputStyle}>
            {Object.keys(COATINGS).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <div style={hintStyle}>{COATINGS[coating].bestFor}</div>
          {COATINGS[coating].note && <div style={{ ...hintStyle, color: "#b45309" }}>{COATINGS[coating].note}</div>}
        </div>

        {/* CUT CARD */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Cut</h3>

          <label style={labelStyle}>Workpiece Material</label>
          <select value={workpieceMaterial} onChange={(e) => setWorkpieceMaterial(e.target.value)} style={inputStyle} disabled={!!preset.chart}>
            {Object.keys(WORKPIECE_MATERIALS).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>

          <label style={labelStyle}>Cutting Speed — SFM</label>
          <input
            type="number"
            step="1"
            value={sfmInput}
            onChange={(e) => setSfmInput(e.target.value)}
            placeholder={`e.g. ${fmt(suggestion.sfm)} (suggested)`}
            style={inputStyle}
          />
          <div style={hintStyle}>
            {suggestion.sfmRange ? `Suggested range: ${fmt(suggestion.sfmRange[0])}–${fmt(suggestion.sfmRange[1])} SFM` : `Published: ${fmt(suggestion.sfm)} SFM`}
          </div>

          <label style={labelStyle}>Chip Load per Tooth — IPT (in)</label>
          <input
            type="number"
            step="0.0001"
            value={iptInput}
            onChange={(e) => setIptInput(e.target.value)}
            placeholder={`e.g. ${fmt(suggestion.ipt, 4)} (suggested)`}
            style={inputStyle}
          />
          <div style={hintStyle}>
            {suggestion.iptRange
              ? `Suggested range: ${fmt(suggestion.iptRange[0], 4)}–${fmt(suggestion.iptRange[1], 4)} in`
              : `Published: ${fmt(suggestion.ipt, 4)} in`}
          </div>

          <label style={labelStyle}>Spindle Speed — RPM (optional, overrides SFM)</label>
          <input type="number" step="1" value={rpmInput} onChange={(e) => setRpmInput(e.target.value)} style={inputStyle} />

          <label style={labelStyle}>Feed Rate — IPM (optional, overrides IPT)</label>
          <input type="number" step="0.1" value={ipmInput} onChange={(e) => setIpmInput(e.target.value)} style={inputStyle} />

          {suggestion.note && <div style={{ ...hintStyle, marginTop: 12, borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>{suggestion.note}</div>}
        </div>

        {/* RESULTS CARD */}
        <div style={{ flex: "1 1 220px", background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Results</h3>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#666" }}>Spindle Speed</div>
            <div style={{ fontSize: 28, fontWeight: "bold", color: "#1e3a8a" }}>{solved.rpm ? fmt(solved.rpm) : "—"} RPM</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#666" }}>Feed Rate</div>
            <div style={{ fontSize: 28, fontWeight: "bold", color: "#16a34a" }}>{solved.ipm ? fmt(solved.ipm, 2) : "—"} IPM</div>
          </div>
        </div>

        {/* DEPTH OF CUT CARD */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Depth of Cut (optional)</h3>

          <label style={labelStyle}>Operation</label>
          <select value={operation} onChange={(e) => setOperation(e.target.value)} style={inputStyle}>
            {Object.keys(OPERATIONS).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <div style={hintStyle}>
            Typical for this operation: Ap (axial) ~{opSuggestion.apOfD}×D, Ae (radial) ~{opSuggestion.aeOfD}×D
          </div>

          <label style={labelStyle}>ADOC — Axial Depth of Cut (in)</label>
          <input
            type="number"
            step="0.001"
            value={adoc}
            onChange={(e) => setAdoc(e.target.value)}
            placeholder={d ? `e.g. ${fmt(opSuggestion.apOfD * d, 3)}` : ""}
            style={inputStyle}
          />
          {d && adocVal != null && <div style={hintStyle}>{fmt((adocVal / d) * 100, 0)}% of diameter</div>}

          <label style={labelStyle}>RDOC — Radial Depth of Cut (in)</label>
          <input
            type="number"
            step="0.001"
            value={rdoc}
            onChange={(e) => setRdoc(e.target.value)}
            placeholder={d ? `e.g. ${fmt(opSuggestion.aeOfD * d, 3)}` : ""}
            style={inputStyle}
          />
          {d && rdocVal != null && <div style={hintStyle}>{fmt((rdocVal / d) * 100, 0)}% of diameter</div>}

          {thinningFactor && thinnedIpt != null && (
            <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 13, color: "#666" }}>Chip thinning</div>
              <div style={{ fontSize: 13 }}>
                At that radial depth, the real chip is thinner than programmed. To still hit the target chip load, you could
                program up to <b>{fmt(thinnedIpt, 4)} in/tooth</b> ({thinningFactor.toFixed(2)}× factor) instead of {fmt(solved.ipt, 4)}.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
