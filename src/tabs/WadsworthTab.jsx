import { useState, useRef, useEffect } from "react";
import { SUPABASE_URL, SUPABASE_KEY } from "../supabase";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/wadsworth-chat`;

export default function WadsworthTab({ name }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hey, I'm Wadsworth. Ask me about speeds/feeds, G-code, M-code, tapping, or Mastercam." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ message: text, author: name }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((m) => [...m, { role: "assistant", text: `Error: ${data.error}` }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", text: data.reply || "(empty response)" }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: `Error reaching Wadsworth: ${String(err)}` }]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", maxWidth: 700 }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 12 }}>Wadsworth</h1>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 16,
          marginBottom: 12,
          background: "#f9fafb",
          minHeight: 300,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 14,
                whiteSpace: "pre-wrap",
                background: m.role === "user" ? "#1e3a8a" : "white",
                color: m.role === "user" ? "white" : "#333",
                border: m.role === "user" ? "none" : "1px solid #e5e7eb",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {sending && <div style={{ fontSize: 13, color: "#999" }}>Wadsworth is thinking...</div>}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Wadsworth something..."
          rows={2}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
            fontSize: 14,
            resize: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={send}
          disabled={sending}
          style={{
            padding: "0 20px",
            background: "#1e3a8a",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
