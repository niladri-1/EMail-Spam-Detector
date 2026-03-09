import { useEffect, useRef, useState } from "react";
import API from "../services/api";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── HTML iframe with forced dark theme
function HtmlEmailFrame({ html }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <style>
        * { box-sizing: border-box; color: inherit !important; background-color: transparent !important; border-color: #2e2e2e !important; }
        html, body { margin:0; padding:12px 16px; font-family:'DM Sans',ui-sans-serif,sans-serif; font-size:14px; line-height:1.75; color:#d4cfc8 !important; background-color:#1c1c1c !important; word-break:break-word; }
        table,tr,td,th { background-color:transparent !important; }
        h1,h2,h3,h4,h5,h6 { color:#ece8d9 !important; margin:0.6em 0 0.3em; }
        p { margin:0.5em 0; }
        a { color:#c96442 !important; text-decoration:underline; }
        img { max-width:100%; height:auto; border-radius:4px; }
        hr { border:none; border-top:1px solid #2e2e2e !important; margin:16px 0; }
        pre,code { background-color:#242424 !important; color:#b8dac8 !important; padding:2px 6px; border-radius:4px; font-size:13px; }
        .gmail_quote,blockquote { border-left:3px solid #3a3632 !important; padding-left:12px; margin:8px 0; color:#8a8480 !important; }
      </style></head><body>${html}</body></html>`);
    doc.close();
    const resize = () => {
      try {
        iframe.style.height =
          iframe.contentDocument.body.scrollHeight + 32 + "px";
      } catch {}
    };
    iframe.onload = resize;
    setTimeout(resize, 150);
    setTimeout(resize, 600);
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      className="email-iframe"
      sandbox="allow-same-origin allow-popups"
      title="Email Content"
    />
  );
}

// ── AI Summary panel
function AISummary({ email, show, onClose }) {
  const [state, setState] = useState("idle"); // idle | loading | done | error
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  // Auto-fetch when shown
  useEffect(() => {
    if (!show) return;
    setSummary("");
    setError("");
    setState("loading");

    API.post("/emails/summarise", {
      subject: email.subject,
      from: email.from,
      date: email.date,
      body: email.body,
      bodyType: email.bodyType,
    })
      .then((res) => {
        setSummary(res.data.summary);
        setState("done");
      })
      .catch((err) => {
        const is429 =
          err.response?.status === 429 ||
          err.response?.data?.error === "quota_exceeded";
        setError(
          is429
            ? "⚠️ AI limit reached — free tier quota exceeded. Please try again in a minute."
            : "Sorry, AI couldn't respond this time. Please try again.",
        );
        setState("error");
      });
  }, [show, email.id]);

  if (!show) return null;

  // Parse bullet points from Gemini response
  const bullets = summary
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

  return (
    <div className="ai-summary-panel">
      <div className="ai-summary-header">
        <div className="ai-summary-title">
          {/* Gemini sparkle icon */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            className="ai-summary-gem-icon"
          >
            <path
              d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"
              fill="currentColor"
            />
          </svg>
          AI Summary
          <span className="ai-summary-model">Gemini 2.5 Flash</span>
        </div>
        <button className="ai-summary-close" onClick={onClose} title="Close">
          <svg
            width="13"
            height="13"
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

      <div className="ai-summary-body">
        {state === "loading" && (
          <div className="ai-summary-loading">
            <div className="ai-summary-dots">
              <span />
              <span />
              <span />
            </div>
            <span>Analysing email…</span>
          </div>
        )}

        {state === "error" && (
          <div className="ai-summary-error">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {state === "done" && (
          <ul className="ai-summary-bullets">
            {bullets.map((b, i) => (
              <li key={i}>
                <span className="ai-bullet-dot" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Main EmailDetail component
function EmailDetail({ email, activeTab, scanResult, onClose }) {
  const [showSummary, setShowSummary] = useState(false);
  const isSent = activeTab === "sent";
  const contact = isSent ? email.to : email.from;
  const initial = contact ? contact.charAt(0).toUpperCase() : "?";
  const label = isSent ? "To" : "From";

  const isSpam = scanResult?.classification === "spam";

  // Reset summary when email changes
  useEffect(() => {
    setShowSummary(false);
  }, [email.id]);

  return (
    <div className="email-detail">
      {/* ── Spam / Safe banner ── */}
      {scanResult && !isSent && (
        <div className={`scan-banner ${isSpam ? "spam" : "safe"}`}>
          <div className="scan-banner-left">
            <span className="scan-banner-icon">{isSpam ? "⚠️" : "✅"}</span>
            <div>
              <span className="scan-banner-title">
                {isSpam ? "Likely Spam" : "Looks Safe"}
              </span>
              <span className="scan-banner-reason">{scanResult.reason}</span>
            </div>
          </div>
          <span className="scan-banner-label">
            {isSpam
              ? "Gmail Spam Checker flagged this email"
              : "Gmail Spam Checker verified this email"}
          </span>
        </div>
      )}

      {/* ── Meta ── */}
      <div className="email-detail-meta">
        <div className="email-detail-meta-top">
          {onClose && (
            <button
              className="email-detail-close"
              onClick={onClose}
              title="Close email"
            >
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
          )}
          <h2>{email.subject || "(no subject)"}</h2>

          {/* AI Summarise button — shown for inbox emails with a body */}
          {!isSent && email.body && (
            <button
              className={`ai-summarise-btn ${showSummary ? "active" : ""}`}
              onClick={() => setShowSummary((p) => !p)}
              title="Summarise with Gemini AI"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z"
                  fill="currentColor"
                />
              </svg>
              {showSummary ? "Hide Summary" : "AI Summary"}
            </button>
          )}
        </div>

        <div className="email-from-row">
          <div
            className={`email-from-avatar ${isSent ? "sent" : ""} ${isSpam ? "spam-avatar" : ""}`}
          >
            {initial}
          </div>
          <div className="email-from-info">
            <span className="email-from">
              <span className="email-from-label">{label}: </span>
              {contact}
            </span>
            {email.date && (
              <span className="email-date">{formatDate(email.date)}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── AI Summary panel ── */}
      <AISummary
        email={email}
        show={showSummary}
        onClose={() => setShowSummary(false)}
      />

      {/* ── Body ── */}
      <div className="email-body-wrapper">
        {email.bodyType === "html" ? (
          <HtmlEmailFrame html={email.body} />
        ) : (
          <pre className="email-body-plain">{email.body}</pre>
        )}
      </div>
    </div>
  );
}

export default EmailDetail;
