
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bookmark,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Globe,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Newspaper,
  Route,
  ScrollText,
  Settings,
  Sparkles,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  keywords: string[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: "Explore",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, keywords: ["home", "overview"] },
      { to: "/current-affairs", label: "Current Affairs", icon: Globe, keywords: ["news", "headlines", "today", "weekly", "monthly"] },
      { to: "/newspapers", label: "Newspapers", icon: Newspaper, keywords: ["times of india", "the hindu", "editorial"] },
      { to: "/ai-tutor", label: "AI Tutor", icon: Sparkles, keywords: ["chat", "ask", "explain", "assistant"] },
      { to: "/statistics-assistant", label: "PDF Learning Assistant", icon: FileText, keywords: ["pdf", "upload", "notes", "document"] },
      { to: "/schemes", label: "Government Schemes", icon: Landmark, keywords: ["policy", "yojana", "ministry", "scheme"] },
      { to: "/exams", label: "Government Exams", icon: GraduationCap, keywords: ["upsc", "ssc", "banking", "railway", "defence", "psc"] },
    ],
  },
  {
    title: "Prepare",
    items: [
      { to: "/study-plans", label: "Study Plans", icon: CalendarDays, keywords: ["planner", "goals", "revision"] },
      { to: "/calendar", label: "Calendar", icon: CalendarDays, keywords: ["events", "schedule", "reminders", "exam dates"] },
      { to: "/quiz", label: "Practice & MCQs", icon: ClipboardCheck, keywords: ["quiz", "mcq", "test"] },
      { to: "/progress", label: "Analytics", icon: Activity, keywords: ["progress", "performance"] },
      { to: "/bookmarks", label: "Bookmarks", icon: Bookmark, keywords: ["saved"] },
    ],
  },
  {
    title: "Learning",
    items: [
      { to: "/courses", label: "Courses", icon: BookOpen, keywords: ["course"] },
      { to: "/lessons", label: "Lessons", icon: ScrollText, keywords: ["lesson"] },
      { to: "/learning-path", label: "Learning Path", icon: Route, keywords: ["path", "roadmap"] },
    ],
  },
  {
    title: "Account",
    items: [
      { to: "/profile", label: "Settings", icon: Settings, keywords: ["profile", "account", "skills"] },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
