import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase";

export default function ShopNotesTab() {
  const [categories, setCategories] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [openCats, setOpenCats] = useState(new Set());
  const [adding, setAdding] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  async function load() {
    const [catRes, noteRes] = await Promise.all([
      supabase.from("shop_note_categories").select("id, name").order("created_at"),
      supabase.from("shop_notes").select("id, category, content, source_file").order("id"),
    ]);
    if (catRes.error) console.error(catRes.error);
    if (noteRes.error) console.error(noteRes.error);
    setCategories(catRes.data || []);
    setNotes(noteRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
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

  const q = query.trim();

  function toggle(cat) {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  async function createCategory(e) {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) return;
    const { error } = await supabase.from("shop_note_categories").insert({ name });
    if (error) {
      console.error(error);
      return;
    }
    setNewCatName("");
    setAdding(false);
    load();
  }

  async function deleteCategory(cat) {
    if (!window.confirm(`Delete category "${cat.name}"? (Only works if it has no notes in it yet.)`)) return;
    const { error } = await supabase.from("shop_note_categories").delete().eq("id", cat.id);
    if (error) {
      console.error(error);
      return;
    }
    load();
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>Shop Notes</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        Your own categories. Create one below, then tell me what to put in it.
      </p>

      {categories.length > 0 && (
        <input
          type="text"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 12px",
            marginBottom: 16,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 14,
          }}
        />
      )}

      {loading && <p style={{ color: "#999", fontSize: 14 }}>Loading...</p>}

      {!loading && categories.length === 0 && !adding && (
        <p style={{ color: "#999", fontSize: 14, marginBottom: 16 }}>No categories yet.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {categories.map((cat) => {
          const items = byCategory[cat.name] || [];
          const isOpen = q.length > 0 ? items.length > 0 : openCats.has(cat.id);
          return (
            <div key={cat.id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                }}
              >
                <button
                  onClick={() => toggle(cat.id)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 15,
                    fontWeight: "bold",
                    color: "#1e3a8a",
                  }}
                >
                  {cat.name}
                </button>
                <span style={{ color: "#999", fontSize: 13, marginRight: 10 }}>
                  {items.length}
                </span>
                <button
                  onClick={() => toggle(cat.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 13, marginRight: 10 }}
                >
                  {isOpen ? "▲" : "▼"}
                </button>
                <button
                  onClick={() => deleteCategory(cat)}
                  title="Delete category"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 16 }}
                >
                  ×
                </button>
              </div>
              {isOpen && (
                <div style={{ padding: "0 16px 14px" }}>
                  {items.length === 0 && (
                    <p style={{ color: "#999", fontSize: 13, margin: 0 }}>No notes in here yet.</p>
                  )}
                  {items.map((n) => (
                    <div key={n.id} style={{ fontSize: 14, color: "#333", marginBottom: 10, whiteSpace: "pre-wrap" }}>
                      {n.content}
                      {n.source_file && (
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

      {adding ? (
        <form onSubmit={createCategory} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            autoFocus
            placeholder="Category name..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            style={{ padding: "10px 16px", borderRadius: 8, border: "none", background: "#1e3a8a", color: "white", cursor: "pointer", fontSize: 14 }}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setNewCatName("");
            }}
            style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", fontSize: 14 }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px dashed #1e3a8a",
            background: "white",
            color: "#1e3a8a",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: "bold",
          }}
        >
          + New Category
        </button>
      )}
    </div>
  );
}
