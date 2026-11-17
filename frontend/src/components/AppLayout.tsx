
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MotionConfig, motion } from "framer-motion";

import Sidebar from "./sidebar";
import Topbar from "./Topbar";
import { ToastProvider, useToast } from "./Toast";
import { useAuth } from "../context/AuthContext";
import { useEventReminders } from "../hooks/useEventReminders";

const COLLAPSE_KEY = "sk-sidebar-collapsed";

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [mobileOpen, setMobileOpen] = useState(false);

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(COLLAPSE_KEY);
    return saved !== null ? saved === "1" : window.innerWidth < 1100;
  });

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Check calendar reminders only while a user is logged in.
  useEventReminders(Boolean(user), (message) => toast(message, "info"));

  return (
    <MotionConfig reducedMotion="user">
      <div className="sk-shell">
        <a href="#main-content" className="sk-skip">
        </a>

        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggle={() => setCollapsed((c) => !c)}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="sk-main">
          <Topbar onOpenMenu={() => setMobileOpen(true)} />

          <main id="main-content" tabIndex={-1} className="sk-content">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}

export default function AppLayout() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
