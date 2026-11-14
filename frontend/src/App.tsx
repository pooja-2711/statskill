import { Route, Routes } from "react-router-dom";
import "./App.css";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./components/PublicLayout";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Dashboard from "./pages/dashboard";
import ComingSoon from "./pages/ComingSoon";
import Courses from "./pages/courses";
import Lessons from "./pages/lessons";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/learning-path" element={<ComingSoon title="Learning Path" />} />
        <Route path="/progress" element={<ComingSoon title="Progress" />} />
        <Route path="/ai-tutor" element={<ComingSoon title="AI Tutor" />} />
        <Route path="/lessons" element={<Lessons />} />
      </Route>
    </Routes>
  );
}

export default App;