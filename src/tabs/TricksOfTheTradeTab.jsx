import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function TricksOfTheTradeTab({ name }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tricks_of_the_trade")
        .select("id, label, url")
        .ilike("author", name)
        .order("created_at");
      if (error) console.error(error);
      if (!cancelled) {
        setDocs(data || []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [name]);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>Tricks of the Trade</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>Notes from personal experience.</p>

      {loading && <p style={{ color: "#999", fontSize: 14 }}>Loading...</p>}

      {!loading && docs.length === 0 && (
        <p style={{ color: "#999", fontSize: 14 }}>Nothing here yet for {name}.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {docs.map((d) => (
          <a
            key={d.id}
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 14,
              textDecoration: "none",
              color: "#1e3a8a",
              fontSize: 14,
              fontWeight: "bold",
              maxWidth: 420,
            }}
          >
            📄 {d.label}
          </a>
        ))}
      </div>
    </div>
  );
}
