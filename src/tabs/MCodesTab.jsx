import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function MCodesTab() {
  const [mcodes, setMcodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("mcodes").select("*").order("sort_order");
      if (error) console.error(error);
      if (!cancelled) {
        setMcodes(data || []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>M-Codes</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Common milling M-codes. Core set is standard, but always check your specific control's manual.
      </p>
      {loading && <p style={{ color: "#999", fontSize: 14 }}>Loading...</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mcodes.map((m) => (
          <div key={m.code} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}>
              <span
                style={{
                  fontFamily: "ui-monospace, Consolas, monospace",
                  background: "#eff6ff",
                  color: "#1e3a8a",
                  padding: "2px 10px",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: "bold",
                }}
              >
                {m.code}
              </span>
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 14, color: "#333" }}>{m.definition}</p>
            <p style={{ margin: 0, fontSize: 13, color: "#999" }}>Example: {m.example}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
