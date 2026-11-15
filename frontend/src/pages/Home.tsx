import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHealth, getWelcome } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [message, setMessage] = useState("Connecting...");
  const [health, setHealth] = useState("checking");

  useEffect(() => {
    getWelcome().then((d) => setMessage(d.message)).catch(() => setMessage("Backend not reachable"));
    getHealth().then((d) => setHealth(d.status)).catch(() => setHealth("down"));
  }, []);

  const dotClass = health === "healthy" ? "ok" : health === "checking" ? "" : "bad";

  return (
    <section className="hero">
      <div className="status-pill">
        <span className={`dot ${dotClass}`} />
        Backend: {health}
      </div>

      <h1>Welcome to <span>Statskill</span></h1>
      <p>{message}</p>

      {user ? (
        <Link className="btn" to="/profile">Go to my profile</Link>
      ) : (
        <div className="row">
          <Link className="btn" to="/register">Get started</Link>
          <Link className="btn secondary" to="/login">Login</Link>
        </div>
      )}
    </section>
  );
}