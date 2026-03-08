import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";

function Login({ onLogin }) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gmail, setGmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`/auth/login`, { username, password });

      localStorage.setItem("token", res.data.access_token);
      await onLogin?.();
      navigate("/menu");

    } catch (error) {
      setError(error?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`/auth/gmail-login`, {
        email: gmail,
        name: gmail.split("@")[0],
      });

      localStorage.setItem("token", res.data.access_token);
      await onLogin?.();
      navigate("/menu");
    } catch (err) {
      setError(err?.response?.data?.detail || "Gmail login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-template">
        <aside className="auth-template-side">
          <p className="auth-template-brand">DMI Canteen</p>
          <h2>Order faster. Eat better.</h2>
          <p>Sign in to continue your campus food ordering experience.</p>
        </aside>

        <form className="auth-card auth-template-card" onSubmit={handleLogin}>
          <div className="auth-tab-row" role="tablist" aria-label="Auth navigation">
            <Link className="auth-tab active" to="/login">Student Login</Link>
            <Link className="auth-tab" to="/admin-login">Admin Login</Link>
            <Link className="auth-tab" to="/register">Register</Link>
          </div>

          <h2>Student Sign In</h2>
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
            {loading ? "Logging in..." : "Login"}
          </button>

          <hr />
          <p>Quick Gmail Login</p>
          <input
            type="email"
            placeholder="yourname@gmail.com"
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

export default Login;