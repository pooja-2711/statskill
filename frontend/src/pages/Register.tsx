import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";
import { getErrorMessage } from "../services/errors";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser({ full_name: fullName, email, password });
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h1>Create account</h1>
      {error && <p className="error">{error}</p>}
      <input placeholder="Full name" value={fullName} minLength={2} maxLength={100}
        onChange={(e) => setFullName(e.target.value)} required />
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password (min 8 characters)" value={password}
        minLength={8} maxLength={128} onChange={(e) => setPassword(e.target.value)} required />
      <button className="btn" disabled={loading}>
        {loading ? "Creating..." : "Register"}
      </button>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </form>
  );
}