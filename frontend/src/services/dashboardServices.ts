
import api from "./api";

interface OverallProgress {
  total_courses: number;
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  level: string;
  is_published: boolean;
}

interface CourseProgress {
  course_id: number;
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
}

interface Skill {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
}

interface UserSkill {
  id: number;
  user_id: number;
  skill_id: number;
  proficiency_level: string;
}

interface QuizAttempt {
  id: number;
  quiz_id: number;
  user_id: number;
  score: number;
  total_points: number;
  percentage: number;
  is_passed: boolean;
  started_at: string;
  submitted_at: string | null;
}

export interface DashboardData {
  stats: {
    enrolled: number | null;
    lessonsDone: number | null;
    totalLessons: number | null;
    completionPercentage: number | null;
    avgScore: number | null;
    availableCourses: number;
  };

  skills: {
    id: number;
    name: string;
    proficiency: string;
  }[];

  recommended: {
    id: number;
    title: string;
    level: string;
    lessons: number | null;
  }[];

  insights: {
    submittedAttempts: number | null;
    passedAttempts: number | null;
  };

  warnings: string[];
}

export async function getDashboard(): Promise<DashboardData> {
  const warnings: string[] = [];

  // Fetch the dashboard's main data concurrently.
  const [
    progressResult,
    coursesResult,
    userSkillsResult,
    skillsResult,
    attemptsResult,
  ] = await Promise.allSettled([
    api.get<OverallProgress>("/progress/me"),
    api.get<Course[]>("/courses"),
    api.get<UserSkill[]>("/skills/me"),
    api.get<Skill[]>("/skills/"),
    api.get<QuizAttempt[]>("/attempts/me"),
  ]);

  // Overall progress
  let overallProgress: OverallProgress | null = null;

  if (progressResult.status === "fulfilled") {
    overallProgress = progressResult.value.data;
  } else {
    warnings.push("Overall learning progress could not be loaded.");
  }

  // Available courses
  let availableCourses: Course[] = [];

  if (
    coursesResult.status === "fulfilled" &&
    Array.isArray(coursesResult.value.data)
  ) {
    availableCourses = coursesResult.value.data;
  } else {
    warnings.push("Available courses could not be loaded.");
  }

  // User skills and skill catalogue
  let userSkills: UserSkill[] = [];
  let allSkills: Skill[] = [];

  if (
    userSkillsResult.status === "fulfilled" &&
    Array.isArray(userSkillsResult.value.data)
  ) {
    userSkills = userSkillsResult.value.data;
  } else {
    warnings.push("Your skills could not be loaded.");
  }

  if (
    skillsResult.status === "fulfilled" &&
    Array.isArray(skillsResult.value.data)
  ) {
    allSkills = skillsResult.value.data;
  } else {
    warnings.push("Skill names could not be loaded.");
  }

  const skillMap = new Map(
    allSkills.map((skill) => [skill.id, skill.name])
  );

  const skills = userSkills
    .filter((userSkill) => skillMap.has(userSkill.skill_id))
    .map((userSkill) => ({
      id: userSkill.id,
      name: skillMap.get(userSkill.skill_id)!,
      proficiency: userSkill.proficiency_level,
    }));

  // Quiz statistics: count submitted attempts only.
  let submittedAttempts: QuizAttempt[] | null = null;

  if (
    attemptsResult.status === "fulfilled" &&
    Array.isArray(attemptsResult.value.data)
  ) {
    submittedAttempts = attemptsResult.value.data.filter(
      (attempt) => attempt.submitted_at !== null
    );
  } else {
    warnings.push("Quiz statistics could not be loaded.");
  }

  const avgScore =
    submittedAttempts && submittedAttempts.length > 0
      ? Math.round(
          submittedAttempts.reduce(
            (total, attempt) => total + attempt.percentage,
            0
          ) / submittedAttempts.length
        )
      : submittedAttempts
        ? null
        : null;

  // Fetch lesson counts for each available course.
  const courseProgressResults = await Promise.allSettled(
    availableCourses.map((course) =>
      api.get<CourseProgress>(`/progress/courses/${course.id}`)
    )
  );

  let courseProgressFailures = 0;

  const recommended = availableCourses.map((course, index) => {
    const result = courseProgressResults[index];

    if (result.status === "fulfilled") {
      return {
        id: course.id,
        title: course.title,
        level: course.level,
        lessons: result.value.data.total_lessons,
      };
    }

    courseProgressFailures++;

    return {
      id: course.id,
      title: course.title,
      level: course.level,
      lessons: null,
    };
  });

  if (courseProgressFailures > 0) {
    warnings.push(
      "Lesson counts for some courses could not be loaded."
    );
  }

  return {
    stats: {
      enrolled: overallProgress?.total_courses ?? null,
      lessonsDone: overallProgress?.completed_lessons ?? null,
      totalLessons: overallProgress?.total_lessons ?? null,
      completionPercentage: overallProgress?.completion_percentage ?? null,
      avgScore,
      availableCourses: availableCourses.length,
    },

    skills,

    recommended,

    insights: {
      submittedAttempts: submittedAttempts?.length ?? null,
      passedAttempts:
        submittedAttempts?.filter((attempt) => attempt.is_passed).length ??
        null,
    },

    warnings,
  };
}
