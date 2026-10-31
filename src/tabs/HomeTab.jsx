import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function HomeTab() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const today = todayStr();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("daily_notes").select("content").eq("date", today).maybeSingle();
      if (error) console.error(error);
      if (!cancelled) {
        setContent(data?.content || "");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [today]);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("daily_notes")
      .upsert({ date: today, content, updated_at: new Date().toISOString() });
    if (error) console.error(error);
    setSaving(false);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 18, color: "#999", margin: "0 0 16px", fontWeight: "normal" }}>{today}</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Today's note..."
        rows={12}
        disabled={loading}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #ccc",
          fontSize: 15,
          boxSizing: "border-box",
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />
      <button
        onClick={save}
        disabled={saving || loading}
        style={{
          marginTop: 12,
          padding: "8px 16px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
