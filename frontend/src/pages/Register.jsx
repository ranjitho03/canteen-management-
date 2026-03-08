import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";

function Register() {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {

      await axios.post(`/auth/register`, {
        username,
        email,
        password,
      });
      navigate("/login");

    } catch (error) {
      setError(error?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-template">
        <aside className="auth-template-side">
          <p className="auth-template-brand">DMI Canteen</p>
          <h2>Create your account</h2>
          <p>Join now to place orders, track payments, and view your order history.</p>
        </aside>

        <form className="auth-card auth-template-card" onSubmit={handleRegister}>
          <div className="auth-tab-row" role="tablist" aria-label="Auth navigation">
            <Link className="auth-tab" to="/login">Student Login</Link>
            <Link className="auth-tab" to="/admin-login">Admin Login</Link>
            <Link className="auth-tab active" to="/register">Register</Link>
          </div>

          <h2>Register</h2>
          <input
            required
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Register;