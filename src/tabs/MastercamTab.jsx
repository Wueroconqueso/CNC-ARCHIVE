import { useState, useEffect, useRef } from "react";
import { supabase, SUPABASE_URL } from "../supabase";

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

// A print is a reference/practice blueprint (exercise drawing), not
// instructional lesson content — identified by the naming convention used
// throughout the library ("-ex-1a", "-ExA", "-Exercise-1", etc.), rather than
// by assuming the main lesson file's name always ends right after the lesson
// number (it doesn't — e.g. "Mill-Lesson-7- New.pdf").
function isPrint(filename) {
  return /-ex-|exa|exb|exercise/i.test(filename);
}

// Orders documents by lesson number (so Lesson 2 comes before Lesson 10,
// unlike plain alphabetical sorting), with each lesson's exercise prints
// grouped right after its main file.
function lessonSortKey(filename) {
  const m = filename.match(/lesson[\s-]*(\d+)([a-z]?)/i);
  const number = m ? parseInt(m[1], 10) : Infinity;
  const suffix = m ? m[2].toUpperCase() : "";
  return { number, suffix };
}

function compareDocs(a, b) {
  const ka = lessonSortKey(a.filename);
  const kb = lessonSortKey(b.filename);
  if (ka.number !== kb.number) return ka.number - kb.number;
  if (ka.suffix !== kb.suffix) return ka.suffix.localeCompare(kb.suffix);
  const printA = isPrint(a.filename);
  const printB = isPrint(b.filename);
  if (printA !== printB) return printA ? 1 : -1;
  return a.filename.localeCompare(b.filename);
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
      .select("filename, chunk_index, storage_path")
      .order("filename");
    if (error) {
      console.error(error);
    } else {
      const byFile = {};
      for (const row of data) {
        if (!byFile[row.filename]) byFile[row.filename] = { count: 0, storagePath: row.storage_path };
        byFile[row.filename].count += 1;
      }
      setDocs(
        Object.entries(byFile)
          .map(([filename, { count, storagePath }]) => ({
            filename,
            count,
            url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(storagePath)}`,
          }))
          .sort(compareDocs)
      );
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

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 4 }}>Mastercam</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Upload Mastercam PDFs — they get stored and broken into searchable text that Wadsworth can
        search and reference.
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
          background: "#1e3a8a",
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

      {loadingDocs && <p style={{ marginTop: 24, color: "#999", fontSize: 14 }}>Loading...</p>}
      {!loadingDocs && docs.length === 0 && (
        <p style={{ marginTop: 24, color: "#999", fontSize: 14 }}>None yet.</p>
      )}
      {!loadingDocs && docs.length > 0 && (
        <>
          <DocList title="Lesson Notes" docs={docs.filter((d) => !isPrint(d.filename))} />
          <DocList title="Print Parts" docs={docs.filter((d) => isPrint(d.filename))} />
        </>
      )}
    </div>
  );
}

function DocList({ title, docs }) {
  if (docs.length === 0) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 8 }}>
        {title} <span style={{ color: "#999", fontWeight: "normal" }}>({docs.length})</span>
      </h3>
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
            <a
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                color: "#1e3a8a",
                textDecoration: "none",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              Open PDF
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
