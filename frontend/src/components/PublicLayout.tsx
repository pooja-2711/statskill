import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicLayout() {
  const { user } = useAuth();
  return (
    <>
      <header className="navbar">
        <div className="nav-inner">
          <Link to="/" className="brand">Statskill</Link>
          <nav className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            {user ? (
              <Link to="/dashboard" className="nav-btn">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-btn">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}