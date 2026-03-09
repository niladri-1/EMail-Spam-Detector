import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api.js";

function Navbar({ showLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (showLogout) {
      API.get("/auth/me")
        .then((res) => {
          if (res.data.email) setUser(res.data);
        })
        .catch(() => {});
    }
  }, [showLogout]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const logout = async () => {
    setOpen(false);
    try {
      await API.get("/auth/logout");
    } catch {}
    localStorage.removeItem("jwt");
    window.history.replaceState(null, "", "/home");
    window.location.replace("/home");
  };

  const login = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URI}/auth/google`;
  };

  return (
    <div className="navbar">
      {/* ── Logo ── */}
      <div className="logo">E-mail Spam Detector</div>

      {/* ── User pill (centered via .navbar-user-wrapper) ── */}
      {user && (
        <div className="navbar-user-wrapper" ref={wrapperRef}>
          <button
            className={`navbar-user ${open ? "open" : ""}`}
            onClick={() => setOpen((p) => !p)}
            aria-haspopup="true"
            aria-expanded={open}
          >
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name}
                className="navbar-avatar"
              />
            )}
            <div className="navbar-user-info">
              <span className="navbar-user-name">{user.name}</span>
              <span className="navbar-user-email">{user.email}</span>
            </div>
            {/* Chevron */}
            <span className={`dropdown-chevron ${open ? "rotated" : ""}`}>
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
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>

          {/* ── Dropdown panel ── */}
          {open && (
            <div className="nav-dropdown">
              {/* Header */}
              <div className="nav-dropdown-header">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="nav-dropdown-avatar"
                  />
                )}
                <div>
                  <div className="nav-dropdown-name">{user.name}</div>
                  <div className="nav-dropdown-email">{user.email}</div>
                </div>
              </div>

              <div className="nav-dropdown-divider" />

              {/* Results */}
              <button
                className="nav-dropdown-item"
                onClick={() => {
                  setOpen(false);
                  navigate("/results");
                }}
              >
                <span className="nav-dropdown-icon">
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
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </span>
                Inbox Health
                <span className="nav-dropdown-tag">Results</span>
              </button>

              {/* Account */}
              <button
                className="nav-dropdown-item"
                onClick={() => {
                  setOpen(false);
                  navigate("/account");
                }}
              >
                <span className="nav-dropdown-icon">
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                Account
              </button>

              {/* Settings */}
              <button
                className="nav-dropdown-item"
                onClick={() => {
                  setOpen(false);
                  navigate("/settings");
                }}
              >
                <span className="nav-dropdown-icon">
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
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                Settings
              </button>

              <div className="nav-dropdown-divider" />

              {/* Sign out */}
              <button className="nav-dropdown-item danger" onClick={logout}>
                <span className="nav-dropdown-icon">
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
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Right side actions (shown when no user / not logged in) ── */}

        <div className="navbar-actions">
          {showLogout ? (
            <button className="btn btn-logout" onClick={logout}>
              Logout
            </button>
          ) : (
            <button className="btn btn-logout" onClick={login}>
              Sign In
            </button>
          )}
        </div>
    </div>
  );
}

export default Navbar;
