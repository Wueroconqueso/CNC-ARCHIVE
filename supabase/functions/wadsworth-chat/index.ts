// Wadsworth — CNC Archive's AI assistant.
// Runs server-side so the Anthropic API key never reaches the browser.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
        system:
          "You are Wadsworth, a CNC milling assistant built into Isaac's personal CNC Archive app. " +
          "Isaac is a CNC machinist (mill operator), not a professional developer, focused on milling " +
          "(not turning) for now. Help with milling questions: speeds/feeds, G-code/M-code, tapping, " +
          "and (once available) Mastercam toolpath questions. Be direct and practical, like a " +
          "knowledgeable shop-floor colleague, not a generic assistant. Keep answers focused on milling " +
          "unless Isaac asks about something else.",
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
