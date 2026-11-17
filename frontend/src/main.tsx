import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext.tsx";
import "./index.css";
import "./theme.css";
import "./shell.css";
import "./dashboard.css";

document.documentElement.dataset.theme =
  localStorage.getItem("sk-theme") === "light" ? "light" : "dark";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
