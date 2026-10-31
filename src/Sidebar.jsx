const TABS = [
  { id: "home", label: "Home" },
  { id: "equations", label: "Equations" },
  { id: "speedfeed", label: "Speed & Feed Calculator" },
  { id: "gcodes", label: "G-Codes" },
  { id: "mcodes", label: "M-Codes" },
];

export default function Sidebar({ active, onSelect }) {
  return (
    <div
      style={{
        width: 220,
        height: "100%",
        background: "white",
        padding: "60px 8px 16px",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: 14, padding: "0 8px 12px", color: "#888" }}>
        CNC ARCHIVE
      </div>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          style={{
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "10px 12px",
            marginBottom: 4,
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            background: active === tab.id ? "#2563eb" : "transparent",
            color: active === tab.id ? "white" : "#333",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
