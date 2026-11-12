export default function TricksOfTheTradeTab() {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>Tricks of the Trade</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Organized reference documents, pulled together from years of shop-floor notes.
      </p>

      <a
        href="https://lwinvwocxtstvyhkicpv.supabase.co/storage/v1/object/public/mastercam-pdfs/personal-notes/CNC_Machining_Notes_Organized.pdf"
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
        📄 CNC Machining Notes — Organized (PDF)
      </a>
    </div>
  );
}
