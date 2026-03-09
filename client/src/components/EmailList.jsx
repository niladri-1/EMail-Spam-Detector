import { useState, useRef, useCallback, useEffect } from "react";
import EmailDetail from "./EmailDetail";
import { useEmails } from "../context/EmailContext";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

// Format "last fetched X mins ago"
function useTimeSince(ts) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!ts) return;
    const update = () => {
      const secs = Math.floor((Date.now() - ts) / 1000);
      if (secs < 60) setLabel("just now");
      else if (secs < 3600) setLabel(`${Math.floor(secs / 60)}m ago`);
      else setLabel(`${Math.floor(secs / 3600)}h ago`);
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [ts]);
  return label;
}

function EmailList() {
  const {
    inbox,
    sent,
    scanMap,
    loading,
    scanning,
    error,
    refresh,
    lastFetched,
    activeEmail: selectedEmail,
    setActiveEmail,
    activeTab,
    setActiveTab,
  } = useEmails();

  const [query, setQuery] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const [listWidth, setListWidth] = useState(35);

  const isMobile = useIsMobile();
  const isDragging = useRef(false);
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const timeSince = useTimeSince(lastFetched);

  // ── Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Don't fire when typing in search
      if (document.activeElement === searchRef.current) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      const emails = activeTab === "inbox" ? filtered(inbox) : filtered(sent);

      if (e.key === "j") {
        // next email
        const idx = emails.findIndex((m) => m.id === selectedEmail?.id);
        const next = emails[Math.min(idx + 1, emails.length - 1)];
        if (next) handleSelectEmail(next);
      }
      if (e.key === "k") {
        // prev email
        const idx = emails.findIndex((m) => m.id === selectedEmail?.id);
        const prev = emails[Math.max(idx - 1, 0)];
        if (prev) handleSelectEmail(prev);
      }
      if (e.key === "r") refresh(); // refresh
      if (e.key === "/") {
        // focus search
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (query) setQuery("");
        else if (showDetail) handleBack();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, selectedEmail, inbox, sent, query, showDetail]);

  // ── Client-side search/filter
  const filtered = (list) => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (m) =>
        (m.subject || "").toLowerCase().includes(q) ||
        (m.from || "").toLowerCase().includes(q) ||
        (m.to || "").toLowerCase().includes(q) ||
        (m.snippet || "").toLowerCase().includes(q),
    );
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setActiveEmail(null);
    setShowDetail(false);
    setQuery("");
  };

  const handleSelectEmail = (mail) => {
    setActiveEmail(mail);
    if (isMobile) setShowDetail(true);
  };

  const handleBack = () => {
    setShowDetail(false);
    setActiveEmail(null);
  };

  // ── Drag resizer (desktop)
  const onMouseDown = (e) => {
    isDragging.current = true;
    e.preventDefault();
  };
  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = ((e.clientX - rect.left) / rect.width) * 100;
    if (w >= 20 && w <= 70) setListWidth(w);
  }, []);
  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const emails = filtered(activeTab === "inbox" ? inbox : sent);
  const spamCount = Object.values(scanMap).filter(
    (s) => s.classification === "spam",
  ).length;

  // ── List panel
  const ListPanel = (
    <div
      className="email-list"
      style={!isMobile ? { width: `${listWidth}%` } : {}}
    >
      {/* Header */}
      <div className="email-list-header">
        <h2 className="email-list-title">
          {activeTab === "inbox" ? "Inbox" : "Sent"}
        </h2>
        <div className="header-right">
          {/* Cache freshness indicator */}
          {lastFetched && !loading && (
            <span className="cache-label" title="Data freshness">
              {timeSince}
            </span>
          )}
          {activeTab === "inbox" && scanning && (
            <span className="scanning-badge">
              <span className="scanning-dot" />
              Scanning…
            </span>
          )}
          <button
            className="refresh-btn"
            onClick={refresh}
            title="Refresh (r)"
            disabled={loading}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: loading ? "spin 0.8s linear infinite" : "none",
              }}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {!isMobile && "Refresh"}
          </button>
        </div>
      </div>

      {/* Spam summary pill */}
      {!loading && activeTab === "inbox" && !scanning && spamCount > 0 && (
        <div className="spam-summary-bar">
          <span className="spam-summary-icon">⚠</span>
          <span>
            {spamCount} spam email{spamCount > 1 ? "s" : ""} detected in your
            inbox
          </span>
        </div>
      )}

      {/* Search bar */}
      <div className="email-search-wrapper">
        <svg
          className="email-search-icon"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={searchRef}
          className="email-search"
          type="text"
          placeholder={`Search ${activeTab}… (press /)`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            className="email-search-clear"
            onClick={() => setQuery("")}
            title="Clear (Esc)"
          >
            <svg
              width="12"
              height="12"
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
      </div>

      {/* Tabs */}
      <div className="email-tabs">
        <button
          className={`email-tab ${activeTab === "inbox" ? "active" : ""}`}
          onClick={() => handleTabChange("inbox")}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
          Inbox
          {!loading && inbox.length > 0 && (
            <span className="tab-count">{inbox.length}</span>
          )}
        </button>
        <button
          className={`email-tab ${activeTab === "sent" ? "active" : ""}`}
          onClick={() => handleTabChange("sent")}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Sent
          {!loading && sent.length > 0 && (
            <span className="tab-count">{sent.length}</span>
          )}
        </button>
      </div>

      <div className="email-count">
        {loading
          ? null
          : query
            ? `${emails.length} of ${(activeTab === "inbox" ? inbox : sent).length} messages`
            : `${emails.length} message${emails.length !== 1 ? "s" : ""}`}
      </div>

      {/* Error state */}
      {error && (
        <div className="email-error">
          <span>⚠ {error}</span>
          <button onClick={refresh}>Retry</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="email-loading">
          {[...Array(6)].map((_, i) => (
            <div className="skeleton-item" key={i}>
              <div className="skeleton-line wide" />
              <div className="skeleton-line narrow" />
            </div>
          ))}
        </div>
      ) : emails.length === 0 ? (
        <div className="email-empty">
          {query ? `No results for "${query}"` : "No messages found"}
        </div>
      ) : (
        <div className="email-items">
          {emails.map((mail) => {
            const scan = activeTab === "inbox" ? scanMap[mail.id] : null;
            return (
              <div
                key={mail.id}
                className={`email-item ${selectedEmail?.id === mail.id ? "active" : ""} ${scan?.classification === "spam" ? "spam-item" : ""}`}
                onClick={() => handleSelectEmail(mail)}
              >
                <div className="email-item-dot" />
                <div className="email-item-content">
                  <div className="email-item-top">
                    <h4>{mail.subject || "(no subject)"}</h4>
                    {activeTab === "inbox" &&
                      (scan ? (
                        <span className={`scan-badge ${scan.classification}`}>
                          {scan.classification === "spam" ? "⚠ Spam" : "✓ Safe"}
                        </span>
                      ) : scanning ? (
                        <span className="scan-badge scanning">···</span>
                      ) : null)}
                  </div>
                  <p>{activeTab === "inbox" ? mail.from : `To: ${mail.to}`}</p>
                  {mail.snippet && (
                    <p className="email-item-snippet">{mail.snippet}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Detail panel
  const DetailPanel = (
    <div
      className="email-view"
      style={!isMobile ? { width: `${100 - listWidth}%` } : {}}
    >
      {isMobile && showDetail && (
        <button className="back-btn" onClick={handleBack}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to {activeTab === "inbox" ? "Inbox" : "Sent"}
        </button>
      )}
      {selectedEmail ? (
        <EmailDetail
          email={selectedEmail}
          activeTab={activeTab}
          scanResult={activeTab === "inbox" ? scanMap[selectedEmail.id] : null}
          onClose={() => setActiveEmail(null)}
        />
      ) : (
        <div className="email-empty-view">
          <div className="email-empty-icon">✦</div>
          <p>Select an email to read</p>
          {!isMobile && (
            <p className="email-empty-hint">
              Use <kbd>j</kbd> / <kbd>k</kbd> to navigate · <kbd>/</kbd> to
              search · <kbd>r</kbd> to refresh
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="email-layout mobile" ref={containerRef}>
        {!showDetail ? ListPanel : DetailPanel}
      </div>
    );
  }

  return (
    <div className="email-layout" ref={containerRef}>
      {ListPanel}
      <div className="resizer" onMouseDown={onMouseDown} />
      {DetailPanel}
    </div>
  );
}

export default EmailList;
