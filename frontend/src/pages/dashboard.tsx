import { useCallback, useEffect, useState } from "react";
import { BarChart3, FileText, Landmark, Newspaper } from "lucide-react";

import {
  getDashboard,
  type DashboardData,
} from "../services/dashboardServices";

import DashboardHero from "../components/dashboard/DashboardHero";
import QuickActionCard from "../components/dashboard/QuickActionCard";
import HeadlinesPanel, {
  type NewsItem,
} from "../components/dashboard/Headlines";
import AIAssistant from "../components/dashboard/AIAssistant";
import ProgressCard from "../components/dashboard/ProgressCard";
import QuickAccess from "../components/dashboard/QuickAccess";
import EventsPanel, {
  type EventItem,
} from "../components/dashboard/EventsPanel";

// Keep these empty until real backend APIs provide the data.
const headlines: NewsItem[] = [];
const events: EventItem[] = [];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setData(await getDashboard());
    } catch {
      setError("Could not load your dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="db">
      <DashboardHero />

      <div className="db-quick">
        <QuickActionCard
          to="/newspapers"
          title="Read Newspapers"
          subtitle="(TOI, The Hindu...)"
          icon={Newspaper}
          tone="gold"
        />
        <QuickActionCard
          to="/current-affairs"
          title="Current Affairs"
          subtitle="Today & Weekly"
          icon={FileText}
          tone="purple"
        />
        <QuickActionCard
          to="/schemes"
          title="Government"
          subtitle="Schemes & Policies"
          icon={Landmark}
          tone="gold"
        />
        <QuickActionCard
          to="/quiz"
          title="Practice"
          subtitle="with MCQs"
          icon={BarChart3}
          tone="gold"
        />
      </div>

      <div className="db-row-2">
        <HeadlinesPanel items={headlines} />
        <AIAssistant />
      </div>

      <div className="db-row-3">
        <ProgressCard
          data={data}
          loading={loading}
          error={error}
          onRetry={loadDashboard}
        />
        <QuickAccess />
        <EventsPanel items={events} />
      </div>
    </div>
  );
}
