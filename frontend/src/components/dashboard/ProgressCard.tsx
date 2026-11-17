
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import type { DashboardData } from "../../services/dashboardServices";
import { ErrorState, Skeleton } from "../StateViews";

interface Props {
  data: DashboardData | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
}

const R = 44;
const C = 2 * Math.PI * R;

const fmt = (v: number | null | undefined, suffix = "") =>
  v === null || v === undefined ? "\u2014" : `${v}${suffix}`;

export default function ProgressCard({
  data,
  loading,
  error,
  onRetry,
}: Props) {
  const stats = data?.stats;
  const pct = stats?.completionPercentage ?? null;

  const shown = Math.max(0, Math.min(100, pct ?? 0));

  const remaining =
    stats &&
    stats.totalLessons !== null &&
    stats.lessonsDone !== null
      ? stats.totalLessons - stats.lessonsDone
      : null;

  let note = "Progress data is currently unavailable.";

  if (pct !== null && remaining !== null) {
    if (stats?.totalLessons === 0) {
      note = "No lessons are available yet.";
    } else if (remaining <= 0) {
      note = "All lessons completed.";
    } else {
      note = `${remaining} ${
        remaining === 1 ? "lesson" : "lessons"
      } to go.`;
    }
  }

  return (
    <section className="db-card" aria-label="Learning progress">
      <div className="db-head">
        <h2 className="db-title">
          <TrendingUp size={20} className="purple" />
          Your Learning Progress
        </h2>

        <Link to="/progress" className="db-link">
          View Details
          <ArrowRight size={15} />
        </Link>
      </div>

      {loading ? (
        <div
          style={{
            display: "flex",
            gap: 22,
            alignItems: "center",
          }}
        >
          <Skeleton height={124} width={124} radius={999} />

          <div
            style={{
              flex: 1,
              display: "grid",
              gap: 10,
            }}
          >
            <Skeleton height={14} width="40%" />
            <Skeleton height={8} />
            <Skeleton height={14} width="70%" />
          </div>
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : (
        <div className="db-progress">
          <div className="db-ring">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <defs>
                <linearGradient
                  id="ringGrad"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0" stopColor="#ffd84d" />
                  <stop offset="1" stopColor="#e5a800" />
                </linearGradient>
              </defs>

              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                strokeWidth="9"
                style={{ stroke: "var(--border)" }}
              />

              <g transform="rotate(-90 50 50)">
                <motion.circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke="url(#ringGrad)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  initial={{ strokeDashoffset: C }}
                  animate={{
                    strokeDashoffset: C * (1 - shown / 100),
                  }}
                  transition={{
                    duration: 1,
                    ease: "easeOut",
                  }}
                />
              </g>
            </svg>

            <span className="db-ring-text">
              {pct === null ? "\u2014" : `${Math.round(pct)}%`}
            </span>
          </div>

          <div className="db-progress-info">
            <p className="db-target">Target: 100%</p>

            <div
              className="db-bar"
              role="progressbar"
              aria-label="Learning completion"
              aria-valuenow={shown}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${shown}%` }} />
            </div>

            <p className="db-note">{note}</p>

            <dl className="db-mini">
              <div>
                <dt>Lessons</dt>
                <dd>
                  {fmt(stats?.lessonsDone)} / {fmt(stats?.totalLessons)}
                </dd>
              </div>

              <div>
                <dt>Avg. quiz score</dt>
                <dd>{fmt(stats?.avgScore, "%")}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </section>
  );
}
