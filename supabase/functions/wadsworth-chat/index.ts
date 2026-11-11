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

// Generic "read a whole small table" helper — used for G-Codes, M-Codes, and
// Tips, which are all small/bounded lists. Rather than searching them (and
// hoping the ranking surfaces the right one), we just hand Wadsworth the
// whole list every time — it's cheap (a few KB) and guarantees it actually
// knows every code, not just the ones a keyword search happened to match.
async function fetchTable(table, orderBy) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&order=${orderBy}`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error(`Fetching ${table} failed:`, err);
    return [];
  }
}

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

// Same OR-ranked search pattern, against daily_notes.content — unlike the
// small static tables above, this one can grow to hundreds of rows over a
// year, so it needs real search rather than a full dump every request. See
// search_daily_notes() in daily_notes_multiuser_migration.sql. Scoped to
// author_filter -- the app has no real login, just a per-device name (see
// src/identity.js), so this keeps "my notes" meaning just that person's own
// entries rather than everyone's.
async function searchDailyNotes(query, authorFilter, limit = 5) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_daily_notes`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ search_query: query, author_filter: authorFilter, match_limit: limit }),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Daily notes search failed:", err);
    return [];
  }
}

// Same OR-ranked search pattern, against shop_notes.content — Isaac's own
// personal shop-floor notes (years of hard-won CNC experience, see
// shop_notes_migration.sql). Not author-scoped like daily_notes: this is
// Isaac's own knowledge base, shared context for anyone using the app.
async function searchShopNotes(query, limit = 8) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_shop_notes`, {
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
    console.error("Shop notes search failed:", err);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, author } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'message' in request body." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [chunks, dailyNoteMatches, shopNoteMatches, gcodes, mcodes, tips] = await Promise.all([
      searchMastercamChunks(message),
      author ? searchDailyNotes(message, author) : Promise.resolve([]),
      searchShopNotes(message),
      fetchTable("gcodes", "sort_order"),
      fetchTable("mcodes", "sort_order"),
      fetchTable("tips", "id"),
    ]);

    let system =
      "You are Wadsworth, a CNC milling assistant built into Isaac's personal CNC Archive app. " +
      `Isaac built this app for himself; the person asking right now is "${author || "someone using the app"}" ` +
      "-- a friend of Isaac's who also uses it sometimes, not necessarily Isaac himself. Isaac is a " +
      "CNC machinist (mill operator), not a professional developer, focused on milling (not turning) " +
      "for now. Help with milling questions: speeds/feeds, G-code/M-code, tapping, and Mastercam " +
      "toolpath questions. Be direct and practical, like a knowledgeable shop-floor colleague, not a " +
      "generic assistant. Keep answers focused on milling unless asked about something else.\n\n" +
      "Prefer the app's own content below (its shared Mastercam training library, this person's own " +
      "daily notes, the shared G-code/M-code reference and tips) when it's relevant — it reflects " +
      "Isaac's actual setup and " +
      "experience. Use web search for anything current, or not covered by his own material (e.g. a " +
      "specific tool manufacturer's spec sheet, a control-specific quirk, general reference lookups).";

    if (gcodes.length > 0) {
      system +=
        "\n\n--- Isaac's G-Codes reference (from the app's G-Codes tab) ---\n" +
        gcodes.map((g) => `${g.code}: ${g.definition} Example: ${g.example}`).join("\n");
    }

    if (mcodes.length > 0) {
      system +=
        "\n\n--- Isaac's M-Codes reference (from the app's M-Codes tab) ---\n" +
        mcodes.map((m) => `${m.code}: ${m.definition} Example: ${m.example}`).join("\n");
    }

    if (tips.length > 0) {
      system += "\n\n--- Tips saved in the app ---\n" + tips.map((t) => `- ${t.content}`).join("\n");
    }

    if (chunks.length > 0) {
      const context = chunks
        .map((c) => `From ${c.filename}:\n${c.content}`)
        .join("\n\n---\n\n");
      system +=
        "\n\n--- Excerpts from Isaac's Mastercam training PDF library that matched his question ---\n" +
        "Use them if relevant to ground your answer in his actual training material — mention which " +
        "lesson/file it's from. Ignore them if they're not actually relevant to the question.\n\n" +
        context;
    }

    if (dailyNoteMatches.length > 0) {
      const context = dailyNoteMatches
        .map((n) => `From ${author}'s daily note (${n.note_date}):\n${n.content}`)
        .join("\n\n---\n\n");
      system +=
        `\n\n--- ${author}'s own daily notes that matched this question ---\n` +
        "Use them if relevant — they're this person's own past notes, so treat them as reliable " +
        "first-hand context. Ignore them if they're not actually relevant.\n\n" +
        context;
    }

    if (shopNoteMatches.length > 0) {
      const context = shopNoteMatches
        .map((n) => `[${n.note_category}] ${n.content}`)
        .join("\n\n---\n\n");
      system +=
        "\n\n--- Isaac's personal shop-floor notes that matched this question ---\n" +
        "These are Isaac's own hard-won notes from years on the machines — treat them as reliable, " +
        "first-hand, shop-specific knowledge. Prefer them over generic advice when they're relevant. " +
        "Ignore them if they're not actually relevant to the question.\n\n" +
        context;
    }

    const anthropicBody = {
      model: "claude-sonnet-5-5",
      max_tokens: 2048,
      system,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
    };

    async function callClaude(messages) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ ...anthropicBody, messages }),
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    }

    // Web search can span multiple turns (search, read results, maybe search
    // again) — the API signals this with stop_reason "pause_turn" instead of
    // finishing. Resume automatically, capped so a runaway chain can't loop
    // forever.
    let messages = [{ role: "user", content: message }];
    let result = await callClaude(messages);
    let continuations = 0;
    const MAX_CONTINUATIONS = 3;

    while (result.ok && result.data?.stop_reason === "pause_turn" && continuations < MAX_CONTINUATIONS) {
      messages = [...messages, { role: "assistant", content: result.data.content }];
      result = await callClaude(messages);
      continuations++;
    }

    if (!result.ok) {
      console.error("Anthropic API error:", result.data);
      return new Response(
        JSON.stringify({ error: result.data?.error?.message ?? "Anthropic API error" }),
        {
          status: result.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // The response can include thinking blocks, server-tool-use/result
    // blocks (from web search), and text blocks, possibly several of each —
    // join every text block in order rather than assuming there's just one.
    const reply = (result.data?.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n\n");

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
