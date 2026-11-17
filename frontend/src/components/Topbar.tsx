import {
  useEffect, useMemo, useRef, useState,
  type FormEvent, type RefObject,
} from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell, ChevronDown, LogOut, Maximize2, Menu, Minimize2, Moon, Search,
  Settings, Sun,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { allNavItems } from "./navItems";
import { useToast } from "./Toast";

type Theme = "dark" | "light";
const THEME_KEY = "sk-theme";

function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, close]);
}

const pop = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.16 },
};

export default function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useDismiss(searchRef, searchOpen, () => setSearchOpen(false));
  useDismiss(notifRef, notifOpen, () => setNotifOpen(false));
  useDismiss(profileRef, profileOpen, () => setProfileOpen(false));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allNavItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.includes(q))
      )
      .slice(0, 6);
  }, [query]);

  function go(to: string) {
    navigate(to);
    setQuery("");
    setSearchOpen(false);
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (matches.length > 0) {
      go(matches[0].to);
    } else if (query.trim()) {
      toast("No matching page. Searching news and schemes needs a search API on the backend.", "info");
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast("Full screen is not available in this browser.", "error");
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initial = user?.full_name?.charAt(0).toUpperCase() ?? "S";

  return (
    <header className="sk-topbar">
      <button className="sk-icon-btn sk-menu-btn" onClick={onOpenMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="sk-search-wrap" ref={searchRef}>
        <form className="sk-search" onSubmit={handleSearchSubmit} role="search">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search for news, topics or government schemes..."
            aria-label="Search"
          />
        </form>

        <AnimatePresence>
          {searchOpen && query.trim() !== "" && (
            <motion.div className="sk-pop" {...pop}>
              {matches.length > 0 ? (
                matches.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.to} className="sk-pop-row" onClick={() => go(item.to)}>
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </button>
                  );
                })
              ) : (
                <p className="sk-pop-empty">No matching pages.</p>
              )}
              <p className="sk-pop-hint">
                This searches pages. News and scheme search will connect once the backend provides it.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="sk-actions">
        <div className="sk-anchor" ref={notifRef}>
          <button
            className="sk-icon-btn"
            onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell size={19} />
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div className="sk-pop" {...pop}>
                <strong className="sk-pop-title">Notifications</strong>
                <p className="sk-pop-empty">You're all caught up.</p>
                <p className="sk-pop-hint">
                  Exam and news alerts will appear here once a notifications API is available.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          className="sk-theme"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          <span className="knob">
            {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
          </span>
        </button>

        <button
          className="sk-icon-btn sk-fs"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        <div className="sk-anchor" ref={profileRef}>
          <button
            className="sk-profile-btn"
            onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
            aria-expanded={profileOpen}
          >
            <span className="sk-avatar">{initial}</span>
            <ChevronDown size={16} />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div className="sk-pop" {...pop}>
                <div className="sk-pop-user">
                  <strong>{user?.full_name}</strong>
                  <small>{user?.email}</small>
                </div>
                <button className="sk-pop-row" onClick={() => { setProfileOpen(false); navigate("/profile"); }}>
                  <Settings size={17} /><span>Settings</span>
                </button>
                <button className="sk-pop-row danger" onClick={handleLogout}>
                  <LogOut size={17} /><span>Logout</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
