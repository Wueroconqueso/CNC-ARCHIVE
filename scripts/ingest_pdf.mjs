// Ingest one or more PDFs directly into the Mastercam knowledge base,
// bypassing the app's browser UI — for Isaac to drop files in via Claude Code
// instead of uploading through the phone/browser one at a time.
//
// Does the exact same extract -> chunk -> upload -> save steps as
// src/tabs/MastercamTab.jsx, so anything ingested here shows up in the app
// too (same Supabase bucket + table).
//
// Usage: node scripts/ingest_pdf.mjs <path-to-pdf> [more paths...]

import { readFile } from "node:fs/promises";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const SUPABASE_URL = "https://lwinvwocxtstvyhkicpv.supabase.co";
const SUPABASE_KEY = "sb_publishable_-aKK1zDOzEd0sQTymO1a4Q_aFR8tvb9";
const BUCKET = "mastercam-pdfs";
const CHUNK_SIZE = 1500; // characters per chunk — matches MastercamTab.jsx

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

async function extractText(buffer) {
  const pdf = await getDocument({
    data: buffer,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => item.str).join(" ") + "\n\n";
  }
  return fullText;
}

async function ingest(filePath) {
  const filename = path.basename(filePath);
  console.log(`\n--- ${filename} ---`);

  const fileBuffer = await readFile(filePath);
  console.log("Extracting text...");
  const text = await extractText(new Uint8Array(fileBuffer));

  if (!text.trim()) {
    console.log("No extractable text found (scanned/image-only PDF?). Skipping.");
    return;
  }

  const storagePath = `${Date.now()}-${filename}`;
  console.log(`Uploading original to storage as ${storagePath}...`);
  const uploadRes = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(storagePath)}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/pdf",
      },
      body: fileBuffer,
    }
  );
  if (!uploadRes.ok) {
    throw new Error(`Storage upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  const chunks = chunkText(text);
  console.log(`Saving ${chunks.length} chunks...`);

  const rows = chunks.map((content, i) => ({
    filename,
    chunk_index: i,
    content,
    storage_path: storagePath,
  }));

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/mastercam_chunks`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!insertRes.ok) {
    throw new Error(`Chunk insert failed: ${insertRes.status} ${await insertRes.text()}`);
  }

  console.log(`Done — ${filename}: ${chunks.length} chunks saved.`);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/ingest_pdf.mjs <path-to-pdf> [more paths...]");
  process.exit(1);
}

for (const f of files) {
  try {
    await ingest(f);
  } catch (err) {
    console.error(`FAILED on ${f}:`, err.message);
  }
}
