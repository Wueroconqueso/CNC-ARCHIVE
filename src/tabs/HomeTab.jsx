import { useState, useEffect } from "react";
import { supabase } from "../supabase";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

export default function HomeTab({ name }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tip, setTip] = useState("");
  const today = todayStr();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("daily_notes")
        .select("content")
        .eq("date", today)
        .eq("author", name)
        .maybeSingle();
      if (error) console.error(error);
      if (!cancelled) {
        setContent(data?.content || "");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [today, name]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("tips").select("content").order("id");
      if (error) {
        console.error(error);
        return;
      }
      if (data && data.length && !cancelled) {
        setTip(data[dayOfYear() % data.length].content);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase
      .from("daily_notes")
      .upsert({ date: today, author: name, content, updated_at: new Date().toISOString() });
    if (error) console.error(error);
    setSaving(false);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 18, color: "#999", margin: "0 0 16px", fontWeight: "normal" }}>
        {today} — {name}'s note
      </h2>
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
          background: "#1e3a8a",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        {saving ? "Saving..." : "Save"}
      </button>

      {tip && (
        <div
          style={{
            marginTop: 32,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: "bold", color: "#888", marginBottom: 6 }}>TIP OF THE DAY</div>
          <p style={{ margin: 0, fontSize: 14, color: "#333" }}>{tip}</p>
        </div>
      )}
    </div>
  );
}
