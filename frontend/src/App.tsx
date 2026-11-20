
import { lazy, Suspense } from "react";
import { Link, Outlet, Route, Routes, useLocation } from "react-router-dom";

import "./App.css";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./components/PublicLayout";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import CalendarPage from "./pages/CalendarPage";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Profile = lazy(() => import("./pages/Profile"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const Courses = lazy(() => import("./pages/courses"));
const Lessons = lazy(() => import("./pages/lessons"));
const Progress = lazy(() => import("./pages/progress"));
const Quiz = lazy(() => import("./pages/quiz"));
const LearningPath = lazy(() => import("./pages/LearningPath"));
const AITutor = lazy(() => import("./pages/AITutor"));
const StatisticsAssistant = lazy(() => import("./pages/StatisticsAssistant"));

const CurrentAffairsPage = lazy(() =>
  import("./pages/modulePages").then((m) => ({
    default: m.CurrentAffairsPage,
  }))
);

const NewspapersPage = lazy(() =>
  import("./pages/modulePages").then((m) => ({
    default: m.NewspapersPage,
  }))
);

const SchemesPage = lazy(() =>
  import("./pages/modulePages").then((m) => ({
    default: m.SchemesPage,
  }))
);

const ExamsPage = lazy(() =>
  import("./pages/modulePages").then((m) => ({
    default: m.ExamsPage,
  }))
);

const StudyPlansPage = lazy(() => import("./pages/StudyPlansPage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));

function PageLoader() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        color: "#64748b",
      }}
      role="status"
    >
      Loading Statskill...
    </div>
  );
}

function NotFound() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" style={{ color: "#2563eb" }}>
        Return to Home
      </Link>
    </div>
  );
}

// Sits inside AppLayout: a crash or slow load affects only the page area.
function PageBoundary() {
  const { pathname } = useLocation();

  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  const { pathname } = useLocation();

  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route element={<PageBoundary />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/learning-path" element={<LearningPath />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/ai-tutor" element={<AITutor />} />
              <Route
                path="/statistics-assistant"
                element={<StatisticsAssistant />}
              />
              <Route path="/lessons" element={<Lessons />} />
              <Route path="/quiz" element={<Quiz />} />

              <Route path="/calendar" element={<CalendarPage />} />

              <Route path="/current-affairs" element={<CurrentAffairsPage />} />
              <Route
                path="/current-affairs/:id"
                element={<CurrentAffairsPage />}
              />
              <Route path="/newspapers" element={<NewspapersPage />} />
              <Route path="/newspapers/:id" element={<NewspapersPage />} />
              <Route path="/schemes" element={<SchemesPage />} />
              <Route path="/schemes/:id" element={<SchemesPage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/exams/:id" element={<ExamsPage />} />

              <Route path="/study-plans" element={<StudyPlansPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
