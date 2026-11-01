import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";

const BUCKET = "mastercam-pdfs";
const CHUNK_SIZE = 1500; // characters per chunk — rough, not token-exact

// Break extracted text into roughly CHUNK_SIZE-character pieces, preferring
// to break on paragraph/sentence boundaries so chunks stay coherent.
function chunkText(text) {
  const chunks = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    if (remaining.length <= CHUNK_SIZE) {
      chunks.push(remaining);
      break;
    }
    let cut = remaining.lastIndexOf("\n\n", CHUNK_SIZE);
    if (cut < CHUNK_SIZE * 0.5) cut = remaining.lastIndexOf(". ", CHUNK_SIZE);
    if (cut < CHUNK_SIZE * 0.5) cut = CHUNK_SIZE;
    chunks.push(remaining.slice(0, cut + 1).trim());
    remaining = remaining.slice(cut + 1).trim();
  }
  return chunks.filter((c) => c.length > 0);
}

async function extractText(file) {
  // Loaded on demand — pdfjs-dist is large (~2MB with its worker) and most
  // tabs never touch a PDF, so it shouldn't be in the app's main bundle.
  const [pdfjsLib, { default: workerUrl }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.mjs?url"),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    fullText += pageText + "\n\n";
  }
  return fullText;
}

export default function MastercamTab() {
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDocs();
  }, []);

  async function loadDocs() {
    setLoadingDocs(true);
    const { data, error } = await supabase
      .from("mastercam_chunks")
      .select("filename, chunk_index")
      .order("filename");
    if (error) {
      console.error(error);
    } else {
      const counts = {};
      for (const row of data) {
        counts[row.filename] = (counts[row.filename] || 0) + 1;
      }
      setDocs(Object.entries(counts).map(([filename, count]) => ({ filename, count })));
    }
    setLoadingDocs(false);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    setStatus(`Reading ${file.name}...`);

    try {
      const text = await extractText(file);
      if (!text.trim()) {
        setStatus(`No extractable text found in ${file.name} (might be a scanned/image-only PDF).`);
        setUploading(false);
        return;
      }

      setStatus(`Uploading ${file.name}...`);
      const storagePath = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file);
      if (uploadError) throw uploadError;

      const chunks = chunkText(text);
      setStatus(`Saving ${chunks.length} chunks...`);

      const rows = chunks.map((content, i) => ({
        filename: file.name,
        chunk_index: i,
        content,
        storage_path: storagePath,
      }));
      const { error: insertError } = await supabase.from("mastercam_chunks").insert(rows);
      if (insertError) throw insertError;

      setStatus(`Done — ${file.name} saved as ${chunks.length} chunks.`);
      loadDocs();
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message || String(err)}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(filename) {
    if (!confirm(`Remove "${filename}" and all its saved chunks?`)) return;

    const { data: chunkRows } = await supabase
      .from("mastercam_chunks")
      .select("storage_path")
      .eq("filename", filename)
      .limit(1);
    const storagePath = chunkRows?.[0]?.storage_path;

    await supabase.from("mastercam_chunks").delete().eq("filename", filename);
    if (storagePath) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }
    loadDocs();
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>Mastercam</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Upload Mastercam PDFs — they get stored and broken into searchable text. Wadsworth will be
        able to search this once wired up.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={uploading}
        style={{ display: "none" }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{
          padding: "8px 16px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: uploading ? "default" : "pointer",
          fontSize: 14,
          opacity: uploading ? 0.6 : 1,
        }}
      >
        {uploading ? "Working..." : "+ Upload PDF"}
      </button>

      {status && <p style={{ marginTop: 12, fontSize: 13, color: "#666" }}>{status}</p>}

      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 8 }}>Uploaded documents</h3>
        {loadingDocs && <p style={{ color: "#999", fontSize: 14 }}>Loading...</p>}
        {!loadingDocs && docs.length === 0 && <p style={{ color: "#999", fontSize: 14 }}>None yet.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {docs.map((d) => (
            <div
              key={d.filename}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "10px 14px",
              }}
            >
              <div>
                <div style={{ fontSize: 14 }}>{d.filename}</div>
                <div style={{ fontSize: 12, color: "#999" }}>{d.count} chunks</div>
              </div>
              <button
                onClick={() => handleDelete(d.filename)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#dc2626",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
