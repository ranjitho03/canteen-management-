import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import axios from "../api/axios";

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gmail, setGmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const navigate = useNavigate();

  const completeAdminSession = useCallback(
    async (accessToken) => {
      localStorage.setItem("token", accessToken);
      const me = await axios.get("/users/me");
      if (me.data.role !== "admin") {
        localStorage.removeItem("token");
        throw new Error("This account is not an admin account");
      }
      await onLogin?.();
      navigate("/admin");
    },
    [navigate, onLogin]
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/auth/admin-login", { username, password });
      await completeAdminSession(res.data.access_token);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/auth/admin-gmail-login", {
        email: gmail,
        name: gmail.split("@")[0],
      });
      await completeAdminSession(res.data.access_token);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Admin Gmail login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (response) => {
      if (!response?.credential) {
        setError("Google sign-in did not return a token");
        return;
      }

      setError("");
      setLoading(true);
      try {
        const res = await axios.post("/auth/admin-google-login", {
          id_token: response.credential,
        });
        await completeAdminSession(res.data.access_token);
      } catch (err) {
        setError(err?.response?.data?.detail || err?.message || "Google admin login failed");
      } finally {
        setLoading(false);
      }
    },
    [completeAdminSession]
  );

  useEffect(() => {
    if (!googleClientId || !window.google?.accounts?.id || !googleButtonRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: 320,
    });
    setGoogleReady(true);
  }, [googleClientId, handleGoogleCredential]);

  return (
    <section className="auth-page">
      <div className="auth-template">
        <aside className="auth-template-side">
          <p className="auth-template-brand">DMI Canteen</p>
          <h2>Admin Control Center</h2>
          <p>Use your admin credentials to manage menu, orders, inventory, and payments.</p>
        </aside>

        <form className="auth-card auth-template-card" onSubmit={handleLogin}>
          <div className="auth-tab-row" role="tablist" aria-label="Auth navigation">
            <Link className="auth-tab" to="/login">Student Login</Link>
            <Link className="auth-tab active" to="/admin-login">Admin Login</Link>
            <Link className="auth-tab" to="/register">Register</Link>
          </div>

          <h2>Admin Sign In</h2>
          <input
            required
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <button disabled={loading} type="submit">
            {loading ? "Logging in..." : "Admin Login"}
          </button>

          <hr />
          <p>Google Admin Login</p>
          {googleClientId ? (
            <div ref={googleButtonRef} style={{ minHeight: 44 }} />
          ) : (
            <p className="error-text">Set VITE_GOOGLE_CLIENT_ID in frontend .env to enable Google sign-in.</p>
          )}
          {googleClientId && !googleReady && <p>Loading Google sign-in...</p>}

          <hr />
          <p>Admin Email Login (fallback)</p>
          <input
            type="email"
            placeholder="adminname@dmice.ac.in"
            value={gmail}
            onChange={(e) => setGmail(e.target.value)}
          />
          <button disabled={loading || !gmail} onClick={handleGmailLogin} type="button">
            Continue with Gmail
          </button>
        </form>
      </div>
    </section>
  );
}

export default AdminLogin;
