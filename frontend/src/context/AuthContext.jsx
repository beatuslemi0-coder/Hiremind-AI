import { createContext, useContext, useEffect, useState } from "react";
import client, { setAuthToken, setStagingAuth } from "../api/client";
import { mapUser } from "../api/vox";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { type: 'interviewee' | 'interviewer', ...record }
  const [restoring, setRestoring] = useState(true);

  function login(token, record, type) {
    // A completed login supersedes any half-finished staging session.
    setStagingAuth(null);
    setAuthToken(token);
    setUser({ ...record, type });
  }

  function logout() {
    setAuthToken(null);
    setStagingAuth(null);
    setUser(null);
  }

  // Patch the signed-in user in place (after profile edits on the Account
  // page) so the shell — welcome chip, avatar initial — reflects it at once.
  function updateUser(patch) {
    setUser((u) => (u ? { ...u, ...patch } : u));
  }

  // Rehydrate: if a token was persisted by client.js, ask the backend who it
  // belongs to. Until this resolves, `restoring` is true so route guards don't
  // bounce a valid session back to the start of the wizard on refresh.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get("/auth/me");
        if (!cancelled && data) {
          const record = mapUser(data?.user || data);
          const { type } = record || {};
          if (type === "interviewer_staging") {
            setUser(null);
          } else if (type === "interviewee" || type === "interviewer") {
            setUser(record);
          } else {
            setAuthToken(null);
          }
        }
      } catch {
        // Invalid/expired token — clear whichever slot it came from.
        if (localStorage.getItem("staging_token")) setStagingAuth(null);
        else setAuthToken(null);
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, restoring, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
