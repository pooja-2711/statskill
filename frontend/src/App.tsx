import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import "./App.css";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./components/PublicLayout";
import AppLayout from "./components/AppLayout";

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

function PageLoader() {
  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "16px",
      color: "#64748b"
    }}>
      Loading Statskill...
    </div>
  );
}

function App() {
  return (
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/learning-path" element={<LearningPath />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/ai-tutor" element={<AITutor />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/quiz" element={<Quiz />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
