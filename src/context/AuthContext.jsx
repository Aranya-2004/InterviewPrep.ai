/**
 * context/AuthContext.jsx
 *
 * Real auth — no demo credentials anywhere.
 * Token is validated against GET /api/auth/me on every app load.
 * Axios interceptors attach the token + auto-logout on 401.
 */

import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from "react";
import axios from "axios";

const API_BASE   = "import.meta.env.VITE_API_URL;";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(null);
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── set base URL ────────────────────────────────────────────────────────
  useEffect(() => {
    axios.defaults.baseURL = API_BASE;
  }, []);

  // ── request interceptor — attach Bearer token to every request ──────────
  useEffect(() => {
    const id = axios.interceptors.request.use((config) => {
      const t = localStorage.getItem("token");
      if (t) config.headers["Authorization"] = `Bearer ${t}`;
      return config;
    });
    return () => axios.interceptors.request.eject(id);
  }, []);

  // ── response interceptor — auto-logout on 401 ───────────────────────────
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) _clearAuth();
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  // ── restore + validate session on app load ───────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser  = localStorage.getItem("user");

      if (!storedToken) { setLoading(false); return; }

      // fast path — show user from localStorage instantly (no flicker)
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); setToken(storedToken); }
        catch { localStorage.removeItem("user"); }
      }

      // slow path — validate token with backend
      try {
        const { data } = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        const freshUser = data.user || data;
        setToken(storedToken);
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      } catch {
        // invalid / expired token
        _clearAuth();
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  function _clearAuth() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  const login = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user",  JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    try { await axios.post("/api/auth/logout"); } catch { /* ignore */ }
    _clearAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      token, user, loading,
      isAuthenticated: !!token && !!user,
      login, logout,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() must be inside <AuthProvider>");
  return ctx;
}