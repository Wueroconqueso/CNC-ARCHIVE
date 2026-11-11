import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase";

const CATEGORY_ORDER = [
  "Tapping", "Drilling", "Reaming", "Endmills & Milling", "Facemilling",
  "Threads & Tap Sizing", "G-Code & M-Code Reference", "Code Examples (Job-Specific)",
  "Materials - Aluminum", "Materials - Steel & Stainless", "Materials - Plastic",
  "Speeds & Feeds", "Fixturing & Workholding", "Inspection & Quality", "GD&T",
  "MasterCam / Gibbs Software Notes", "Shop Practices & General Notes", "Job-Specific Notes",
  "General Math & Formulas", "Open Questions / To Follow Up",
];

export default function ShopNotesTab() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [openCats, setOpenCats] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("shop_notes")
        .select("id, category, content, source_file")
        .order("id");
      if (error) console.error(error);
      if (!cancelled) {
        setNotes(data || []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byCategory = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = {};
    for (const n of notes) {
      if (q && !n.content.toLowerCase().includes(q)) continue;
      if (!map[n.category]) map[n.category] = [];
      map[n.category].push(n);
    }
    return map;
  }, [notes, query]);

  const categories = CATEGORY_ORDER.filter((c) => byCategory[c]?.length);
  const q = query.trim();

  function toggle(cat) {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>Shop Notes</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Isaac's own shop-floor notes and Mastercam lesson notes — organized by topic, {notes.length} entries total.
      </p>

      <input
        type="text"
        placeholder="Search notes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 12px",
          marginBottom: 20,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          fontSize: 14,
        }}
      />

      {loading && <p style={{ color: "#999", fontSize: 14 }}>Loading...</p>}

      {!loading && categories.length === 0 && (
        <p style={{ color: "#999", fontSize: 14 }}>No notes match "{q}".</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {categories.map((cat) => {
          const items = byCategory[cat];
          const isOpen = q.length > 0 || openCats.has(cat);
          return (
            <div key={cat} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <button
                onClick={() => toggle(cat)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "14px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 15,
                  fontWeight: "bold",
                  color: "#1e3a8a",
                }}
              >
                <span>{cat}</span>
                <span style={{ color: "#999", fontWeight: "normal", fontSize: 13 }}>
                  {items.length} {isOpen ? "▲" : "▼"}
                </span>
              </button>
              {isOpen && (
                <div style={{ padding: "0 16px 14px" }}>
                  {items.map((n) => (
                    <div key={n.id} style={{ fontSize: 14, color: "#333", marginBottom: 10, whiteSpace: "pre-wrap" }}>
                      {n.content}
                      {n.source_file && n.source_file !== "Codex_My_Edit_Official_10-13-26.docx" && (
                        <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>from {n.source_file}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
