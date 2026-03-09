import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  applySettings,
  THEMES,
  ACCENT_COLORS,
  FONT_SIZES,
} from "../hooks/useSettings";

const THEME_LIST = [
  { id: "dark", label: "Dark" },
  { id: "darker", label: "Midnight" },
  { id: "warm", label: "Warm" },
  { id: "forest", label: "Forest" },
  { id: "ocean", label: "Ocean" },
  { id: "rose", label: "Rose" },
];

const ACCENT_LIST = [
  { id: "orange", label: "Orange" },
  { id: "green", label: "Green" },
  { id: "blue", label: "Blue" },
  { id: "pink", label: "Pink" },
  { id: "yellow", label: "Amber" },
  { id: "purple", label: "Purple" },
];

const FONT_SIZE_LIST = [
  { id: "sm", label: "Small" },
  { id: "md", label: "Medium" },
  { id: "lg", label: "Large" },
];

function SettingsPage() {
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );
  const [accent, setAccent] = useState(
    () => localStorage.getItem("accent") || "orange",
  );
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem("fontSize") || "md",
  );
  const [compactMode, setCompactMode] = useState(
    () => localStorage.getItem("compactMode") === "true",
  );
  const [showSnippets, setShowSnippets] = useState(
    () => localStorage.getItem("showSnippets") !== "false",
  );
  const [saved, setSaved] = useState(false);

  const handleTheme = (id) => {
    setTheme(id);
    localStorage.setItem("theme", id);
    applySettings();
  };

  const handleAccent = (id) => {
    setAccent(id);
    localStorage.setItem("accent", id);
    applySettings();
  };

  const handleFontSize = (id) => {
    setFontSize(id);
    localStorage.setItem("fontSize", id);
    applySettings();
  };

  const handleSave = () => {
    localStorage.setItem("compactMode", compactMode);
    localStorage.setItem("showSnippets", showSnippets);
    applySettings();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setTheme("dark");
    setAccent("orange");
    setFontSize("md");
    setCompactMode(false);
    setShowSnippets(true);
    ["theme", "accent", "fontSize", "compactMode", "showSnippets"].forEach(
      (k) => localStorage.removeItem(k),
    );
    applySettings();
  };

  const currentBg = THEMES[theme]?.bg || "#1a1a1a";
  const currentColor = ACCENT_COLORS[accent]?.color || "#c96442";

  return (
    <div className="page-wrapper">
      <Navbar showLogout={true} />
      <div className="settings-container">
        <div className="settings-header">
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
          <h1 className="settings-title">Settings</h1>
          <p className="settings-sub">
            Changes apply instantly as you pick them
          </p>
        </div>

        <div className="settings-sections">
          <div className="settings-section">
            <h2 className="settings-section-title">Theme</h2>
            <div className="theme-grid">
              {THEME_LIST.map((t) => {
                const bg = THEMES[t.id]?.bg || "#1a1a1a";
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    className={`theme-swatch ${isActive ? "active" : ""}`}
                    style={{
                      background: bg,
                      borderColor: isActive ? currentColor : "#2e2e2e",
                    }}
                    onClick={() => handleTheme(t.id)}
                  >
                    <div
                      className="swatch-dot"
                      style={{ background: currentColor }}
                    />
                    <span
                      className="swatch-label"
                      style={{ color: isActive ? currentColor : "#6a6662" }}
                    >
                      {t.label}
                    </span>
                    {isActive && (
                      <div
                        className="swatch-check"
                        style={{ color: currentColor }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="settings-section">
            <h2 className="settings-section-title">Accent Color</h2>
            <div className="accent-grid">
              {ACCENT_LIST.map((a) => {
                const color = ACCENT_COLORS[a.id]?.color || "#c96442";
                const isActive = accent === a.id;
                return (
                  <button
                    key={a.id}
                    className={`accent-swatch ${isActive ? "active" : ""}`}
                    style={{
                      background: color,
                      boxShadow: isActive
                        ? `0 0 0 3px ${currentBg}, 0 0 0 5px ${color}`
                        : "none",
                    }}
                    onClick={() => handleAccent(a.id)}
                    title={a.label}
                  >
                    {isActive && (
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="settings-hint">
              Changes the highlight color throughout the app
            </p>
          </div>

          <div className="settings-section">
            <h2 className="settings-section-title">Font Size</h2>
            <div className="font-size-row">
              {FONT_SIZE_LIST.map((f) => (
                <button
                  key={f.id}
                  className={`font-size-btn ${fontSize === f.id ? "active" : ""}`}
                  onClick={() => handleFontSize(f.id)}
                >
                  <span style={{ fontSize: FONT_SIZES[f.id] }}>Aa</span>
                  <span className="font-size-label">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h2 className="settings-section-title">Display</h2>
            <div className="toggle-rows">
              <div className="toggle-row">
                <div>
                  <div className="toggle-title">Compact Mode</div>
                  <div className="toggle-desc">
                    Reduce padding in email list for more emails visible
                  </div>
                </div>
                <button
                  className={`toggle-btn ${compactMode ? "on" : ""}`}
                  onClick={() => setCompactMode((p) => !p)}
                  role="switch"
                  aria-checked={compactMode}
                >
                  <div className="toggle-thumb" />
                </button>
              </div>
              <div className="toggle-row">
                <div>
                  <div className="toggle-title">Show Email Snippets</div>
                  <div className="toggle-desc">
                    Show a preview of the email body in the list
                  </div>
                </div>
                <button
                  className={`toggle-btn ${showSnippets ? "on" : ""}`}
                  onClick={() => setShowSnippets((p) => !p)}
                  role="switch"
                  aria-checked={showSnippets}
                >
                  <div className="toggle-thumb" />
                </button>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-footer-actions">
              <button className="action-btn neutral" onClick={handleReset}>
                Reset to Defaults
              </button>
              <button
                className={`action-btn primary ${saved ? "saved" : ""}`}
                onClick={handleSave}
              >
                {saved ? (
                  <>
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
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Saved
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
