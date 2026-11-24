// Reference data for the Speed & Feed Calculator.
// Workpiece ranges are general starting points, not gospel — always confirm
// against your tool manufacturer's chart and adjust for rigidity/coolant.

export const WORKPIECE_MATERIALS = {
  "Aluminum (6061 / wrought)": { sfm: [600, 1000], ipt: [0.003, 0.006] },
  "Aluminum (cast alloy)": { sfm: [400, 900], ipt: [0.0015, 0.005] },
  "Mild Steel (1018)": { sfm: [300, 450], ipt: [0.002, 0.004] },
  "Alloy Steel (4140)": { sfm: [250, 400], ipt: [0.0015, 0.0035] },
  "Stainless Steel (304/316)": { sfm: [120, 220], ipt: [0.001, 0.0025] },
  "Cast Iron": { sfm: [250, 400], ipt: [0.003, 0.006] },
  "Brass": { sfm: [500, 800], ipt: [0.003, 0.006] },
  "Tool Steel (hardened 40-55 HRc)": { sfm: [80, 180], ipt: [0.0008, 0.002] },
  "Titanium": { sfm: [60, 120], ipt: [0.001, 0.002] },
  "Delrin / Acetal (plastic)": { sfm: [400, 700], ipt: [0.003, 0.006] },
};

export const TOOL_MATERIALS = {
  Carbide: { sfmMultiplier: 1.0 },
  HSS: { sfmMultiplier: 0.35 },
  "Cobalt (HSSCo)": { sfmMultiplier: 0.5 },
};

// "bestFor" / multipliers are general machining-industry guidance, not a
// specific manufacturer's published numbers, unless noted otherwise.
export const COATINGS = {
  Uncoated: { sfmMultiplier: 1.0, bestFor: "General purpose, especially non-ferrous" },
  TiN: { sfmMultiplier: 1.15, bestFor: "General purpose, low heat resistance, good lubricity" },
  TiCN: { sfmMultiplier: 1.25, bestFor: "Aluminum, brass, bronze — good abrasion resistance" },
  TiAlN: { sfmMultiplier: 1.4, bestFor: "Steels, stainless, cast iron, up to ~40 HRc" },
  AlTiN: { sfmMultiplier: 1.45, bestFor: "Hard materials >38 HRc, titanium, Inconel" },
  "TISINOS-PRO (Garr)": {
    sfmMultiplier: 1.35,
    bestFor: "Garr's general-purpose high-performance coating",
    estimated: true,
    note: "Multiplier is a generic coated-carbide estimate — Garr's own published numbers weren't accessible (their charts are gated PDFs and their online calculator is JS-driven). Treat as a rough starting point, not Garr's confirmed data.",
  },
  "ALUMASTAR / TiB2 (Garr)": { sfmMultiplier: 1.1, bestFor: "Aluminum alloys — low aluminum affinity, resists built-up edge" },
  AlCrN: { sfmMultiplier: 1.3, bestFor: "Titanium, Inconel, carbon fiber — hot hardness" },
  "Diamond (CVD)": { sfmMultiplier: 1.5, bestFor: "Composites, graphite, fiberglass" },
};

export const OPERATIONS = {
  Slotting: { apOfD: 1.0, aeOfD: 1.0 },
  "Side Cutting": { apOfD: 1.5, aeOfD: 0.5 },
  "Side Cutting (HSM, light radial)": { apOfD: 2.0, aeOfD: 0.05 },
  "Profiling / Finishing": { apOfD: 0.1, aeOfD: 0.2 },
};

// Diameter-indexed charts are real published manufacturer data (not estimates).
// Each chart is keyed by diameter in inches -> { sfm, ipt }.
export const TOOL_PRESETS = [
  { id: "custom", label: "— Custom (no preset) —" },
  {
    id: "garr_tisinos_steel",
    label: "Garr — TISINOS-PRO coated carbide (Steel)",
    toolMaterial: "Carbide",
    coating: "TISINOS-PRO (Garr)",
    workpieceMaterial: "Mild Steel (1018)",
    source:
      "Generic coated-carbide estimate. Garr's TISINOS-PRO is a real Garr Tool coating, but their speeds-and-feeds charts are bot-gated PDFs and their online Technical Advisor is JS-driven — neither was readable when this was built (2026-11-24). Verify against garrtool.com/calc or your own cut tests before trusting this for production.",
  },
  {
    id: "yg1_alupower_wrought",
    label: "YG-1 ALU-POWER HPC, 3-flute — Aluminum (wrought)",
    toolMaterial: "Carbide",
    coating: "Uncoated",
    flutes: 3,
    workpieceMaterial: "Aluminum (6061 / wrought)",
    operation: "Slotting",
    source: "YG-1's own published ALU-POWER HPC speed & feed chart (yg1usa.com), slotting condition (Ap=1.0D, Ae=1.0D), material N21-22.",
    chart: {
      0.125: { sfm: 2000, ipt: 0.001 },
      0.1875: { sfm: 2000, ipt: 0.0015 },
      0.25: { sfm: 2000, ipt: 0.003 },
      0.3125: { sfm: 2000, ipt: 0.0038 },
      0.375: { sfm: 2000, ipt: 0.0045 },
      0.5: { sfm: 2000, ipt: 0.006 },
      0.625: { sfm: 2000, ipt: 0.0066 },
      0.75: { sfm: 2000, ipt: 0.0075 },
      1.0: { sfm: 2000, ipt: 0.01 },
    },
  },
  {
    id: "yg1_alupower_cast",
    label: "YG-1 ALU-POWER HPC, 3-flute — Aluminum (cast alloy)",
    toolMaterial: "Carbide",
    coating: "Uncoated",
    flutes: 3,
    workpieceMaterial: "Aluminum (cast alloy)",
    operation: "Slotting",
    source: "YG-1's own published ALU-POWER HPC speed & feed chart (yg1usa.com), slotting condition (Ap=1.0D, Ae=1.0D), material N23-25.",
    chart: {
      0.125: { sfm: 880, ipt: 0.0008 },
      0.1875: { sfm: 880, ipt: 0.0012 },
      0.25: { sfm: 880, ipt: 0.002 },
      0.3125: { sfm: 880, ipt: 0.0025 },
      0.375: { sfm: 880, ipt: 0.004 },
      0.5: { sfm: 880, ipt: 0.005 },
      0.625: { sfm: 880, ipt: 0.0055 },
      0.75: { sfm: 880, ipt: 0.006 },
      1.0: { sfm: 880, ipt: 0.007 },
    },
  },
];

export function nearestChartDiameter(chart, diameter) {
  const sizes = Object.keys(chart).map(Number);
  if (!diameter || !sizes.length) return sizes[0];
  return sizes.reduce((best, d) => (Math.abs(d - diameter) < Math.abs(best - diameter) ? d : best), sizes[0]);
}
