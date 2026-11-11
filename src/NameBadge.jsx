import { useState } from "react";
import { getActiveName, setActiveName } from "./identity";

export default function NameBadge({ name, onChange }) {
  const [editing, setEditing] = useState(!name);
  const [draft, setDraft] = useState(name);

  function save() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setActiveName(trimmed);
    onChange(trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 20,
          display: "flex",
          gap: 6,
          background: "white",
          border: "1px solid #ccc",
          borderRadius: 6,
          padding: 6,
        }}
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="Your name"
          style={{ border: "none", outline: "none", fontSize: 13, width: 100 }}
        />
        <button
          onClick={save}
          style={{
            border: "none",
            background: "#1e3a8a",
            color: "white",
            borderRadius: 4,
            fontSize: 12,
            padding: "2px 8px",
            cursor: "pointer",
          }}
        >
          Set
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(name);
        setEditing(true);
      }}
      title="Click to change name"
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 20,
        border: "1px solid #ccc",
        background: "white",
        borderRadius: 6,
        padding: "8px 12px",
        fontSize: 13,
        color: "#1e3a8a",
        cursor: "pointer",
      }}
    >
      {name}
    </button>
  );
}
