import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../services/api.js";

function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await API.get("/auth/logout");
    } catch {}
    localStorage.removeItem("jwt");
    window.history.replaceState(null, "", "/home");
    window.location.replace("/home");
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== user?.email) return;
    try {
      await API.delete("/account");
    } catch {}
    localStorage.removeItem("jwt");
    window.history.replaceState(null, "", "/home");
    window.location.replace("/home");
  };

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
          <h1 className="settings-title">Account</h1>
          <p className="settings-sub">Manage your account information</p>
        </div>

        {loading ? (
          <div className="results-loading">
            <div className="results-spinner" />
            <p>Loading…</p>
          </div>
        ) : (
          <div className="settings-sections">
            {/* ── Profile card with Sign Out built in ── */}
            <div className="settings-section">
              <h2 className="settings-section-title">Profile</h2>
              <div className="account-profile-card">
                {user?.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="account-avatar"
                  />
                )}
                <div className="account-info">
                  <div className="account-name">{user?.name}</div>
                  <div className="account-email">{user?.email}</div>
                  <div className="account-profile-footer">
                    <div className="account-badge">
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Verified via Google
                    </div>
                    <button
                      className="account-signout-btn"
                      onClick={handleLogout}
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
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Account Details ── */}
            <div className="settings-section">
              <h2 className="settings-section-title">Account Details</h2>
              <div className="info-rows">
                <div className="info-row">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{user?.name || "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{user?.email || "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Auth Provider</span>
                  <span className="info-value">Google OAuth 2.0</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Data Storage</span>
                  <span className="info-value">MongoDB (profile only)</span>
                </div>
              </div>
              <p className="info-note">
                Your emails are never stored. They are fetched live from Gmail
                on each session using your secure OAuth token.
              </p>
            </div>

            {/* ── Danger Zone ── */}
            <div className="settings-section">
              <h2 className="settings-section-title danger-title">
                Danger Zone
              </h2>
              <div className="settings-action-card danger-card">
                <div>
                  <div className="action-card-title">Delete Account</div>
                  <div className="action-card-desc">
                    Permanently remove your profile from our database. This
                    cannot be undone.
                  </div>
                </div>
                <button
                  className="action-btn danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete confirm modal ── */}
        {showDeleteConfirm && (
          <div
            className="modal-overlay"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-icon danger">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </div>
              <h3 className="modal-title">Delete Account</h3>
              <p className="modal-desc">
                This will permanently delete your profile. Type your email to
                confirm.
              </p>
              <input
                className="modal-input"
                type="text"
                placeholder={user?.email}
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
              />
              <div className="modal-actions">
                <button
                  className="modal-btn cancel"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInput("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="modal-btn danger"
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== user?.email}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountPage;
