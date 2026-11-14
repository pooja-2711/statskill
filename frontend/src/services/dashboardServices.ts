import { mockDashboard } from "../mocks/dashboard";
import type { DashboardData } from "../mocks/dashboard";

// Later, replace the body with: return (await api.get("/dashboard")).data;
export async function getDashboard(): Promise<DashboardData> {
  await new Promise((r) => setTimeout(r, 400)); // fake network delay
  return mockDashboard;
}