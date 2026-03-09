// src/context/EmailContext.jsx
import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import API from "../services/api";

const CACHE_TTL = 5 * 60 * 1000;
const EmailContext = createContext(null);

export function EmailProvider({ children }) {
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [scanMap, setScanMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  // ── Active email — shared so ChatBot can read it
  const [activeEmail, setActiveEmail] = useState(null);
  const [activeTab, setActiveTab] = useState("inbox");

  const abortRef = useRef(null);

  const scanInbox = useCallback(async (emails) => {
    if (!emails.length) return;
    setScanning(true);
    try {
      const payload = emails.map(({ id, subject, from, snippet }) => ({
        id,
        subject,
        from,
        snippet,
      }));
      const res = await API.post("/emails/scan", { emails: payload });
      setScanMap(res.data);
    } catch (err) {
      console.warn("Scan failed:", err.message);
    } finally {
      setScanning(false);
    }
  }, []);

  const fetchEmails = useCallback(
    async (force = false) => {
      if (!force && lastFetched && Date.now() - lastFetched < CACHE_TTL) return;
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const res = await API.get("/emails", {
          signal: abortRef.current.signal,
        });
        const inboxEmails = res.data.inbox || [];
        const sentEmails = res.data.sent || [];
        setInbox(inboxEmails);
        setSent(sentEmails);
        setScanMap({});
        setLastFetched(Date.now());
        scanInbox(inboxEmails);
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          setError("Failed to load emails. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [lastFetched, scanInbox],
  );

  useEffect(() => {
    fetchEmails();
  }, []); // eslint-disable-line

  const refresh = useCallback(() => fetchEmails(true), [fetchEmails]);

  return (
    <EmailContext.Provider
      value={{
        inbox,
        sent,
        scanMap,
        loading,
        scanning,
        error,
        lastFetched,
        refresh,
        activeEmail,
        setActiveEmail,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
}

export function useEmails() {
  const ctx = useContext(EmailContext);
  if (!ctx) throw new Error("useEmails must be used inside <EmailProvider>");
  return ctx;
}
