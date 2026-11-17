import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { ParliamentArt } from "./Art";

const checks = ["Latest News", "Government Schemes", "Exam-Oriented Analysis", "Smart Summaries"];

export default function DashboardHero() {
  return (
    <section className="db-hero">
      <div>
        <h1>
          Your AI-Powered
          <br />
          <em>Current Affairs</em> Assistant
        </h1>
        <p className="db-sub">Read. Understand. Prepare.</p>
        <Link to="/current-affairs" className="db-cta">
          <Zap size={18} /> Explore Today <ArrowRight size={18} />
        </Link>
      </div>

      <div className="db-hero-art">
        <ParliamentArt />
      </div>

      <ul className="db-checks">
        {checks.map((c) => (
          <li key={c}>
            <CheckCircle2 size={20} />
            {c}
          </li>
        ))}
      </ul>
    </section>
  );
}