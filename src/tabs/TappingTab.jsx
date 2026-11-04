import { SUPABASE_URL } from "../supabase";

const BUCKET = "mastercam-pdfs";
const GUHRING_PATH = "reference/guhring-tap-drill-and-decimal-equivalents-chart.pdf";
const guhringUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(GUHRING_PATH)}`;

export default function TappingTab() {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>Tapping</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Reference charts for tap drill sizes, decimal equivalents, and speed/feed equations.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 14 }}>Guhring Tap Drill Sizes &amp; Decimal Equivalents Chart</div>
          <div style={{ fontSize: 12, color: "#999" }}>
            Decimal equivalents, UNC/UNF &amp; metric tap drill sizes, speed/feed equations
          </div>
        </div>
        <a
          href={guhringUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 13,
            color: "#1e3a8a",
            textDecoration: "none",
            fontWeight: "bold",
            whiteSpace: "nowrap",
          }}
        >
          Open PDF
        </a>
      </div>
    </div>
  );
}
