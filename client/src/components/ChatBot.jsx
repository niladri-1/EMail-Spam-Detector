import { useState, useRef, useEffect } from "react";
import API from "../services/api";
import { useEmails } from "../context/EmailContext";

const SUGGESTIONS = [
  "What is this email about?",
  "Is this email safe to reply to?",
  "How does spam detection work?",
  "How do I improve my inbox health?",
];

function TypingDots() {
  return (
    <div className="chat-typing">
      <span />
      <span />
      <span />
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  const isFallback = msg.model && msg.model !== "gemini-2.5-flash";
  return (
    <div className={`chat-msg ${isUser ? "user" : "bot"}`}>
      {!isUser && (
        <div className="chat-bot-avatar">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
          </svg>
        </div>
      )}
      <div className="chat-bubble-wrap">
        <div className="chat-bubble">
          {msg.text.split("\n").map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </div>
        {isFallback && (
          <div
            className="chat-fallback-badge"
            title={`Primary model rate-limited — answered by ${msg.model}`}
          >
            ↩ {msg.model}
          </div>
        )}
      </div>
    </div>
  );
}

// Strip HTML for sending email body to backend
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function ChatBot() {
  const { activeEmail, scanMap, activeTab } = useEmails();

  const [open, setOpen] = useState(false);
  const getWelcome = (email) =>
    email
      ? { role: "bot", text: `What would you like to know about this email?` }
      : {
          role: "bot",
          text: "Hi! Ask me anything about your emails or how this app works.",
        };

  const [messages, setMessages] = useState([getWelcome(null)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [pulse, setPulse] = useState(true);

  // Track last email id to detect when user switches emails
  const lastEmailIdRef = useRef(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // When email changes — reset conversation with a fresh greeting
  useEffect(() => {
    const id = activeEmail?.id ?? null;
    if (id === lastEmailIdRef.current) return;
    lastEmailIdRef.current = id;
    setMessages([getWelcome(activeEmail)]);
    setInput("");
  }, [activeEmail?.id]);

  useEffect(() => {
    if (open) {
      setPulse(false);
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    // Build email context object to send with every message
    let emailContext = null;
    if (activeEmail) {
      const scanResult = activeTab === "inbox" ? scanMap[activeEmail.id] : null;
      const bodyPlain =
        activeEmail.bodyType === "html"
          ? stripHtml(activeEmail.body || "").slice(0, 3000)
          : (activeEmail.body || "").slice(0, 3000);

      emailContext = {
        subject: activeEmail.subject || "(no subject)",
        from: activeEmail.from || "unknown",
        to: activeEmail.to || "",
        date: activeEmail.date || "",
        snippet: activeEmail.snippet || "",
        bodyPreview: bodyPlain,
        spamResult: scanResult
          ? `${scanResult.classification} — ${scanResult.reason}`
          : "not scanned",
        tab: activeTab,
      };
    }

    try {
      const res = await API.post("/chat", {
        message: q,
        history: messages.filter((m) => !m.isNotice), // exclude notices from history
        emailContext,
      });
      const answer = res.data.reply;
      const usedModel = res.data.model || "gemini-2.5-flash";
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: answer, model: usedModel },
      ]);
      if (!open) setUnread((u) => u + 1);
    } catch (err) {
      const msg =
        err.response?.status === 429 ||
        err.response?.data?.error === "quota_exceeded"
          ? "⚠️ AI is temporarily unavailable — free tier limit reached. Please try again in a minute."
          : "Sorry, AI couldn't respond this time. Please try again.";
      setMessages((prev) => [...prev, { role: "bot", text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Dynamic suggestions based on whether an email is open
  const suggestions = activeEmail
    ? [
        "What is this email about?",
        "Is this email safe to reply to?",
        "Summarise the key points",
        "What action should I take?",
      ]
    : SUGGESTIONS;

  const showSuggestions =
    messages.filter((m) => m.role === "user").length === 0;

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        className={`chatbot-trigger ${open ? "open" : ""} ${pulse ? "pulse" : ""}`}
        onClick={() => setOpen((p) => !p)}
        aria-label="Open chat assistant"
      >
        {open ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
          </svg>
        )}
        {!open && unread > 0 && <span className="chatbot-badge">{unread}</span>}
      </button>

      {/* ── Chat window ── */}
      <div className={`chatbot-window ${open ? "visible" : ""}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-header-icon">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
              </svg>
            </div>
            <div>
              <div className="chatbot-header-name">Inbox Assistant</div>
              <div className="chatbot-header-status">
                <span className="chatbot-status-dot" />
                {activeEmail
                  ? `Reading: ${(activeEmail.subject || "email").slice(0, 22)}${activeEmail.subject?.length > 22 ? "…" : ""}`
                  : "Powered by Gemini"}
              </div>
            </div>
          </div>
          <button className="chatbot-close" onClick={() => setOpen(false)}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} />
          ))}
          {loading && (
            <div className="chat-msg bot">
              <div className="chat-bot-avatar">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
                </svg>
              </div>
              <TypingDots />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="chatbot-suggestions">
            {suggestions.map((s) => (
              <button
                key={s}
                className="chatbot-suggestion"
                onClick={() => send(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="chatbot-input-row">
          <textarea
            ref={inputRef}
            className="chatbot-input"
            placeholder={
              activeEmail ? "Ask about this email…" : "Ask anything…"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button
            className="chatbot-send"
            onClick={() => send()}
            disabled={!input.trim() || loading}
            title="Send (Enter)"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
