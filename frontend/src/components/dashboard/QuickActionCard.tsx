import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Props {
  to: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: "gold" | "purple";
}

export default function QuickActionCard({ to, title, subtitle, icon: Icon, tone }: Props) {
  return (
    <Link to={to} className="db-qcard">
      <span className={`db-qicon ${tone}`}><Icon size={26} /></span>
      <span className="db-qtext">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <span className="db-qarrow"><ArrowRight size={17} /></span>
    </Link>
  );
}