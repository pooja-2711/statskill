
import { useCallback, useEffect, useState } from "react";
import { BarChart3, FileText, Landmark, Newspaper } from "lucide-react";

import {
  getDashboard,
  type DashboardData,
} from "../services/dashboardServices";

import {
  getCurrentAffairs,
  type ContentItem,
} from "../services/contentService";

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

// Events remain unchanged until an events API is connected.


const events: EventItem[] = [
  {
    id: "upsc-ifos-main-2026",
    date: "2026-11-22",
    title: "UPSC Indian Forest Service Main 2026",
    subtitle: "Examination date",
    category: "Exam",
    url: "https://upsc.gov.in/active-examinations/indian-forest-service-main-examination-2026/",
  },
  {
    id: "upsc-cisf-2027",
    date: "2026-11-25",
    title: "UPSC CISF AC (EXE) LDCE 2027",
    subtitle: "Notification release",
    category: "Notification",
    url: "https://upsc.gov.in/examination-calendar/",
  },
  {
    id: "upsc-nda-cds-2027",
    date: "2026-12-02",
    title: "UPSC NDA & CDS I 2027",
    subtitle: "Notification release",
    category: "Notification",
    url: "https://upsc.gov.in/examination-calendar/",
  },
  {
    id: "upsc-so-steno-2026",
    date: "2026-12-12",
    title: "UPSC SO/Steno LDCE 2026",
    subtitle: "Examination: 12–13 December",
    category: "Exam",
    url: "https://upsc.gov.in/active-examinations/combined-section-officers-grade-b-ldce-2026-and-combined-stenographers-grade-b-grade-i-ldce-2022-2023-and-2024/",
  },
  {
    id: "ugc-net-dec-2026",
    date: "2026-12-14",
    title: "UGC-NET December 2026",
    subtitle: "Examinations: 14–18 and 21 December",
    category: "Exam",
    url: "https://nta.ac.in/Download/Notice/Notice_20261119125453.pdf",
  },
];



export default function Dashboard() {
  // Dashboard data
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Current Affairs headlines
  const [headlines, setHeadlines] = useState<NewsItem[]>([]);
  const [headlinesLoading, setHeadlinesLoading] = useState(true);
  const [headlinesError, setHeadlinesError] = useState("");

  // Load dashboard information
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

  // Load the latest five Current Affairs articles
  useEffect(() => {
    let active = true;

    async function loadHeadlines() {
      try {
        setHeadlinesLoading(true);
        setHeadlinesError("");

        const result = await getCurrentAffairs({
          page: 1,
          page_size: 5,
        });

        if (!active) return;

        const mappedHeadlines: NewsItem[] = result.items.map(
          (item: ContentItem) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            publishedAt: item.published_at || item.fetched_at,
          })
        );

        setHeadlines(mappedHeadlines);
      } catch (err) {
        if (!active) return;

        setHeadlinesError(
          err instanceof Error
            ? err.message
            : "Could not load current affairs headlines."
        );
      } finally {
        if (active) {
          setHeadlinesLoading(false);
        }
      }
    }

    void loadHeadlines();

    return () => {
      active = false;
    };
  }, []);

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
        <HeadlinesPanel
          items={headlines}
          loading={headlinesLoading}
          error={headlinesError}
        />

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
