import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen, ChevronsLeft, ChevronsRight, Landmark, LogOut, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { navGroups } from "./navItems";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
}

export default function Sidebar({ collapsed, mobileOpen, onToggle, onCloseMobile }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = user?.full_name?.charAt(0).toUpperCase() ?? "S";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
      <div className={`sk-backdrop ${mobileOpen ? "show" : ""}`} onClick={onCloseMobile} aria-hidden="true" />
      <aside className={`sk-sidebar ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-open" : ""}`} aria-label="Main navigation">
        <div className="sk-brand">
          <span className="sk-logo"><BookOpen size={22} /></span>
          <div className="sk-brand-text">
            <strong>Statskill</strong>
            <small>Learn · Analyze · Excel</small>
          </div>
          <button className="sk-icon-btn sk-close" onClick={onCloseMobile} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="sk-nav">
          {navGroups.map((group) => (
            <div className="sk-group" key={group.title}>
              <span className="sk-group-title">{group.title}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} className="sk-link"
                    title={collapsed ? item.label : undefined} onClick={onCloseMobile}>
                    {({ isActive }) => (
                      <>
                        {isActive && <motion.span layoutId="sk-active-pill" className="sk-pill"
                          transition={{ type: "spring", stiffness: 380, damping: 34 }} />}
                        <Icon size={19} className="sk-ico" />
                        <span className="sk-label">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sk-quote">
          <Landmark size={26} />
          <p>“Knowledge today, Service tomorrow.”</p>
        </div>

        <div className="sk-foot">
          <div className="sk-user">
            <span className="sk-avatar">{initial}</span>
            <div className="sk-user-text">
              <strong>{user?.full_name}</strong>
              <small>{user?.email}</small>
            </div>
          </div>

          <button className="sk-link sk-logout" onClick={handleLogout} title={collapsed ? "Logout" : undefined}>
            <LogOut size={19} className="sk-ico" />
            <span className="sk-label">Logout</span>
          </button>

          <button className="sk-link sk-collapse" onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <ChevronsRight size={19} className="sk-ico" /> : <ChevronsLeft size={19} className="sk-ico" />}
            <span className="sk-label">Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}
