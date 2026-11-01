// Wadsworth — CNC Archive's AI assistant.
// Runs server-side so the Anthropic API key never reaches the browser.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
// Supabase injects these into every Edge Function automatically — no secret to manage.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Full-text search against the Mastercam PDF chunks, via the
// search_mastercam_chunks() Postgres function (see
// mastercam_search_function_migration.sql). That function matches on ANY
// word in the question (ranked by how many matched) rather than requiring
// every word to match — a strict AND missed real answers whenever the
// question happened to include a word (e.g. a lesson number) that didn't
// line up with the PDF text's tokenization. Returns [] on no match or any
// error — a search miss should never break the chat.
async function searchMastercamChunks(query, limit = 5) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_mastercam_chunks`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ search_query: query, match_limit: limit }),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Mastercam search failed:", err);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'message' in request body." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chunks = await searchMastercamChunks(message);

    let system =
      "You are Wadsworth, a CNC milling assistant built into Isaac's personal CNC Archive app. " +
      "Isaac is a CNC machinist (mill operator), not a professional developer, focused on milling " +
      "(not turning) for now. Help with milling questions: speeds/feeds, G-code/M-code, tapping, " +
      "and Mastercam toolpath questions. Be direct and practical, like a " +
      "knowledgeable shop-floor colleague, not a generic assistant. Keep answers focused on milling " +
      "unless Isaac asks about something else.";

    if (chunks.length > 0) {
      const context = chunks
        .map((c) => `From ${c.filename}:\n${c.content}`)
        .join("\n\n---\n\n");
      system +=
        "\n\nThe following excerpts from Isaac's Mastercam training PDF library matched his " +
        "question. Use them if relevant to ground your answer in his actual training material — " +
        "mention which lesson/file it's from. Ignore them if they're not actually relevant to the " +
        "question.\n\n" + context;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return new Response(JSON.stringify({ error: data?.error?.message ?? "Anthropic API error" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The response can include a "thinking" block before the actual text
    // block — find the text block specifically rather than assuming it's
    // the first one.
    const textBlock = data?.content?.find((block) => block.type === "text");
    const reply = textBlock?.text ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
