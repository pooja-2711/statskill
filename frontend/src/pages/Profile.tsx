import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

 return (
  <div className="card">
    <h1>My Profile</h1>
    <div className="profile-row"><span>ID</span><span>{user?.id}</span></div>
    <div className="profile-row"><span>Name</span><span>{user?.full_name}</span></div>
    <div className="profile-row"><span>Email</span><span>{user?.email}</span></div>
    <div className="profile-row"><span>Status</span><span>{user?.is_active ? "Active" : "Inactive"}</span></div>
    <button className="btn secondary" onClick={handleLogout}>Logout</button>
  </div>
);
}