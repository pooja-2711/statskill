import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/courses", label: "Courses" },
  { to: "/learning-path", label: "Learning Path" },
  { to: "/progress", label: "Progress" },
  { to: "/ai-tutor", label: "AI Tutor" },
  { to: "/profile", label: "Profile" },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">Statskill</div>
        <nav className="sidebar-nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button className="side-logout" onClick={handleLogout}>Logout</button>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <span>Welcome back, <strong>{user?.full_name}</strong></span>
          <div className="avatar">{user?.full_name?.charAt(0).toUpperCase()}</div>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}