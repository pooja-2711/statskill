export interface DashboardData {
  stats: { enrolled: number; lessonsDone: number; avgScore: number; streak: number };
  skills: { name: string; score: number }[];
  recommended: { id: number; title: string; level: string; lessons: number }[];
  weakTopics: string[];
}

export const mockDashboard: DashboardData = {
  stats: { enrolled: 3, lessonsDone: 12, avgScore: 68, streak: 5 },
  skills: [
    { name: "Sampling", score: 45 },
    { name: "Census", score: 70 },
    { name: "GDP", score: 85 },
    { name: "Data Visualization", score: 90 },
  ],
  recommended: [
    { id: 1, title: "Sampling Methods", level: "Beginner", lessons: 8 },
    { id: 2, title: "Understanding CPI", level: "Intermediate", lessons: 10 },
    { id: 3, title: "PLFS Survey Basics", level: "Intermediate", lessons: 6 },
  ],
  weakTopics: ["Sampling", "Survey Methodology"],
};