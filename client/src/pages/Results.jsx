import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useEmails } from "../context/EmailContext";

// ── Donut SVG
function Donut({ pct, color, size = 130 }) {
  const r = 48,
    cx = 60,
    cy = 60;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="12"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
    </svg>
  );
}

function Results() {
  const navigate = useNavigate();
  const { inbox, scanMap, loading, scanning, refresh } = useEmails();

  // Compute stats from context data (no extra fetch needed)
  const total = inbox.length;
  const scanned = Object.keys(scanMap).length;
  const spamList = Object.values(scanMap).filter(
    (s) => s.classification === "spam",
  );
  const safeList = Object.values(scanMap).filter(
    (s) => s.classification === "safe",
  );
  const spamCount = spamList.length;
  const safeCount = safeList.length;
  const healthPct = scanned > 0 ? Math.round((safeCount / scanned) * 100) : 0;

  const healthLabel =
    healthPct >= 90
      ? "Excellent"
      : healthPct >= 70
        ? "Good"
        : healthPct >= 50
          ? "Fair"
          : healthPct >= 30
            ? "Poor"
            : "Critical";

  const healthColor =
    healthPct >= 70 ? "#4ade80" : healthPct >= 50 ? "#fbbf24" : "#f87171";

  // Top spam reasons
  const reasonCounts = {};
  spamList.forEach((s) => {
    if (s.reason) reasonCounts[s.reason] = (reasonCounts[s.reason] || 0) + 1;
  });
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxReason = topReasons[0]?.[1] || 1;

  const spamRate = scanned > 0 ? (spamCount / scanned) * 100 : 0;
  const safeRate = 100 - spamRate;

  const isReady = !loading && !scanning && scanned > 0;

  return (
    <div className="page-wrapper">
      <Navbar showLogout={true} />
      <div className="results-container">
        <div className="results-header">
          <button className="back-link" onClick={() => navigate("/")}>
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
            Back to Inbox
          </button>
          <h1 className="results-title">Inbox Health</h1>
          <p className="results-sub">
            {loading
              ? "Loading emails…"
              : scanning
                ? "Scanning for spam…"
                : scanned > 0
                  ? `Analysis of ${scanned} emails · Refreshes automatically`
                  : "No emails analysed yet"}
          </p>
        </div>

        {loading || (scanning && scanned === 0) ? (
          <div className="results-loading">
            <div className="results-spinner" />
            <span>
              {loading ? "Fetching emails…" : "Running spam analysis…"}
            </span>
          </div>
        ) : (
          <>
            {/* ── Hero row ── */}
            <div className="results-hero-grid">
              <div className="results-score-card">
                <div className="donut-wrapper">
                  <Donut pct={healthPct} color={healthColor} />
                  <div className="donut-center">
                    <span
                      className="donut-score"
                      style={{ color: healthColor }}
                    >
                      {healthPct}%
                    </span>
                    <span
                      className="donut-label"
                      style={{ color: healthColor }}
                    >
                      {healthLabel}
                    </span>
                  </div>
                </div>
                <p className="score-desc">
                  Inbox health score based on spam analysis
                </p>
              </div>

              <div className="results-stats-grid">
                {[
                  {
                    label: "Total",
                    value: total,
                    bg: "#1e1e1e",
                    color: "#ece8d9",
                  },
                  {
                    label: "Safe",
                    value: safeCount,
                    bg: "rgba(74,222,128,0.08)",
                    color: "#4ade80",
                  },
                  {
                    label: "Spam",
                    value: spamCount,
                    bg: "rgba(248,113,113,0.08)",
                    color: "#f87171",
                  },
                  {
                    label: "Scanned",
                    value: scanned,
                    bg: "#1e1e1e",
                    color: "#ece8d9",
                  },
                ].map(({ label, value, bg, color }) => (
                  <div
                    className="stat-card"
                    key={label}
                    style={{ background: bg }}
                  >
                    <span className="stat-value" style={{ color }}>
                      {value}
                    </span>
                    <span className="stat-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Spam rate bar ── */}
            {isReady && (
              <div className="results-section">
                <h2 className="results-section-title">Spam Rate</h2>
                <div className="rate-bar-wrapper">
                  <div className="rate-bar-track">
                    <div
                      className="rate-bar-fill safe"
                      style={{ width: `${safeRate}%` }}
                    />
                    <div
                      className="rate-bar-fill spam"
                      style={{ width: `${spamRate}%` }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <span className="rate-bar-legend">
                      <span className="legend-dot safe" />
                      {safeRate.toFixed(1)}% safe
                    </span>
                    <span className="rate-bar-legend">
                      <span className="legend-dot spam" />
                      {spamRate.toFixed(1)}% spam
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Top spam signals ── */}
            {isReady && topReasons.length > 0 && (
              <div className="results-section">
                <h2 className="results-section-title">Top Spam Signals</h2>
                <div className="reasons-list">
                  {topReasons.map(([reason, count], i) => (
                    <div className="reason-row" key={reason}>
                      <span className="reason-rank">#{i + 1}</span>
                      <span className="reason-text">{reason}</span>
                      <span className="reason-count">
                        {count} email{count > 1 ? "s" : ""}
                      </span>
                      <div className="reason-bar-track">
                        <div
                          className="reason-bar-fill"
                          style={{ width: `${(count / maxReason) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Health tip ── */}
            {isReady && (
              <div className={`health-tip ${healthPct >= 70 ? "good" : "bad"}`}>
                <span className="health-tip-icon">
                  {healthPct >= 70 ? "✅" : "⚠️"}
                </span>
                <div>
                  <div className="health-tip-title">
                    {healthPct >= 70
                      ? "Your inbox looks healthy"
                      : "Your inbox needs attention"}
                  </div>
                  <div className="health-tip-desc">
                    {healthPct >= 70
                      ? "Most emails in your inbox are from legitimate senders. Keep reviewing unfamiliar senders before clicking links."
                      : `${spamCount} spam email${spamCount > 1 ? "s were" : " was"} detected. Consider unsubscribing from bulk senders and marking obvious spam to train Gmail's filter.`}
                  </div>
                </div>
              </div>
            )}

            {/* Scanning in progress overlay */}
            {scanning && scanned > 0 && (
              <div className="results-scanning-notice">
                <div
                  className="results-spinner"
                  style={{ width: 16, height: 16, borderWidth: 2 }}
                />
                <span>Scanning remaining emails…</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Results;
