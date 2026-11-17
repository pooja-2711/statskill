import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { CalendarDays, Coins, FileText, Star, Zap } from "lucide-react";

interface Item {
  to: string;
  label: string;
  icon: LucideIcon;
  tone: "gold" | "purple";
}

const items: Item[] = [
  { to: "/current-affairs?topic=union-budget", label: "Union Budget Analysis", icon: Coins, tone: "gold" },
  { to: "/current-affairs?source=pib", label: "Daily PIB Summary", icon: FileText, tone: "purple" },
  { to: "/bookmarks", label: "Important Articles", icon: Star, tone: "gold" },
  { to: "/exams", label: "Exam Updates", icon: CalendarDays, tone: "purple" },
];

export default function QuickAccess() {
  return (
    <section className="db-card" aria-label="Quick access">
      <div className="db-head">
        <h2 className="db-title"><Zap size={20} className="gold" /> Quick Access</h2>
      </div>
      <div className="db-qa">
        {items.map(({ to, label, icon: Icon, tone }) => (
          <Link key={label} to={to}>
            <span className={`db-qa-icon ${tone}`}><Icon size={22} /></span>
            {label}
          </Link>
        ))}
      </div>
    </section>
  );
}