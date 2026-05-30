import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const CATEGORIES = ["All", "Feeds & Speeds", "Tooling", "Setups", "G-Code", "Materials", "Notes"];

export default function App() {
  const [entries, setEntries] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Feeds & Speeds", content: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    const { data, error } = await supabase.from("entries").select("*").order("created_at", { ascending: false });
    if (error) console.error(error);
    else setEntries(data);
    setLoading(false);
  }

  async function handleAdd() {
    if (!form.title || !form.content) return;
    const { error } = await supabase.from("entries").insert([{
      title: form.title,
      category: form.category,
      content: form.content,
      date: new Date().toISOString().split("T")[0],
    }]);
    if (error) console.error(error);
    else {
      setForm({ title: "", category: "Feeds & Speeds", content: "" });
      setShowForm(false);
      fetchEntries();
    }
  }

  const filtered = entries.filter((e) => {
    const matchCat = selectedCategory === "All" || e.category === selectedCategory;
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>CNC Machining Archive</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>Your personal knowledge base for setups, speeds, and notes.</p>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #ccc", fontSize: 14 }}
        />
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: "8px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}
        >
          + New Entry
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: "1px solid #ccc", cursor: "pointer", fontSize: 13,
              background: selectedCategory === cat ? "#2563eb" : "white",
              color: selectedCategory === cat ? "white" : "#333",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>New Entry</h3>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ width: "100%", padding: 8, marginBottom: 8, borderRadius: 6, border: "1px solid #ccc", fontSize: 14, boxSizing: "border-box" }}
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            style={{ width: "100%", padding: 8, marginBottom: 8, borderRadius: 6, border: "1px solid #ccc", fontSize: 14, boxSizing: "border-box" }}
          >
            {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
          </select>
          <textarea
            placeholder="Notes, speeds, settings..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={4}
            style={{ width: "100%", padding: 8, marginBottom: 8, borderRadius: 6, border: "1px solid #ccc", fontSize: 14, boxSizing: "border-box" }}
          />
          <button
            onClick={handleAdd}
            style={{ padding: "8px 16px", background: "#16a34a", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14 }}
          >
            Save Entry
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading && <p style={{ color: "#999" }}>Loading...</p>}
        {!loading && filtered.length === 0 && <p style={{ color: "#999" }}>No entries found.</p>}
        {filtered.map((entry) => (
          <div key={entry.id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{entry.title}</h3>
              <span style={{ fontSize: 12, background: "#eff6ff", color: "#2563eb", padding: "2px 10px", borderRadius: 12 }}>{entry.category}</span>
            </div>
            <p style={{ margin: 0, color: "#444", fontSize: 14 }}>{entry.content}</p>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "#999" }}>{entry.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
}