
from sqlalchemy import func

from app.db.session import SessionLocal
from app.models.course import Course
from app.models.learning_path import LearningPath
from app.models.learning_path_course import LearningPathCourse
from app.models.lesson import Lesson

OWNER_ID = 8


# --------------------------------------------------
# LESSON AND COURSE HELPERS
# --------------------------------------------------

def make_lesson(title, description, concepts, example):
    return {
        "title": title,
        "description": description,
        "concepts": concepts,
        "example": example,
        "exercise": (
            f"Practise the topic '{title}'. Write down the important "
            "concepts and solve a related question using your own example."
        ),
        "outcome": (
            f"Understand {title.lower()} and apply the concepts "
            "to examination questions or practical problems."
        ),
    }


def make_course(title, description, level, lessons):
    return {
        "title": title,
        "description": description,
        "level": level,
        "lessons": lessons,
    }


# --------------------------------------------------
# COMPLETE LEARNING CATALOGUE
# 2 PATHS, 16 COURSES, 48 LESSONS
# --------------------------------------------------

LEARNING_CONTENT = [
    {
        "title": "Government Exams Preparation",
        "description": (
            "Prepare for Indian government examinations through "
            "structured courses covering UPSC, SSC, Banking, Railways, "
            "State PSC, Defence, General Studies and Current Affairs."
        ),
        "target_level": "Beginner",
        "courses": [

            make_course(
                "UPSC Civil Services Preparation",
                "Learn UPSC examination structure, General Studies, "
                "syllabus planning and answer-writing techniques.",
                "Beginner",
                [
                    make_lesson(
                        "Understanding the UPSC Civil Services Examination",
                        "Understand the stages and structure of the UPSC examination.",
                        "Preliminary Examination, Main Examination, Personality Test, official notifications.",
                        "A candidate qualifies the Preliminary Examination before appearing for the Main Examination."
                    ),
                    make_lesson(
                        "General Studies and Optional Subjects",
                        "Explore the major subjects covered in the UPSC syllabus.",
                        "History, Geography, Polity, Economy, Environment, Science and Technology, Optional Subjects.",
                        "Connect constitutional provisions with current government policies while studying Indian Polity."
                    ),
                    make_lesson(
                        "Answer Writing and Revision Strategy",
                        "Develop structured answer-writing and revision habits.",
                        "Introduction, body, conclusion, analytical answers, previous-year questions.",
                        "An answer about water conservation can explain the problem, challenges and practical solutions."
                    ),
                ],
            ),

            make_course(
                "SSC CGL and CHSL Preparation",
                "Prepare for SSC examinations through mathematics, reasoning, "
                "English and general awareness.",
                "Beginner",
                [
                    make_lesson(
                        "Introduction to SSC CGL and CHSL",
                        "Understand the purpose and structure of SSC recruitment examinations.",
                        "Staff Selection Commission, CGL, CHSL, computer-based examinations, official notifications.",
                        "CGL and CHSL are separate examinations with different posts and eligibility requirements."
                    ),
                    make_lesson(
                        "Quantitative Aptitude and Reasoning",
                        "Practise mathematical and logical problem-solving.",
                        "Percentages, ratios, averages, number series, analogy, coding-decoding.",
                        "If 20% of a number is 40, the number is 40 divided by 0.20, which equals 200."
                    ),
                    make_lesson(
                        "English and General Awareness",
                        "Build English language skills and general knowledge.",
                        "Grammar, vocabulary, comprehension, Indian history, geography, current affairs.",
                        "Identify the subject and verb in the sentence: The students prepare for the examination."
                    ),
                ],
            ),

            make_course(
                "Banking Exams Preparation",
                "Develop aptitude, reasoning, English and banking awareness "
                "for banking recruitment examinations.",
                "Beginner",
                [
                    make_lesson(
                        "Introduction to Banking Examinations",
                        "Understand common banking recruitment examinations.",
                        "IBPS, SBI recruitment, preliminary examination, main examination, interviews.",
                        "Different banking recruitment notifications may specify different selection stages."
                    ),
                    make_lesson(
                        "Banking Quantitative Aptitude and Reasoning",
                        "Practise numerical and logical questions.",
                        "Simplification, data interpretation, profit and loss, puzzles, seating arrangement, syllogism.",
                        "An account balance increasing from ₹1,000 to ₹1,100 represents a 10% increase."
                    ),
                    make_lesson(
                        "English and Banking Awareness",
                        "Learn English comprehension and banking terminology.",
                        "RBI, commercial banks, digital payments, financial inclusion, reading comprehension.",
                        "The Reserve Bank of India is India's central bank."
                    ),
                ],
            ),

            make_course(
                "Railway Exams Preparation",
                "Study mathematics, reasoning, science and general awareness "
                "for railway recruitment examinations.",
                "Beginner",
                [
                    make_lesson(
                        "Understanding Railway Recruitment Examinations",
                        "Explore railway recruitment and post-specific requirements.",
                        "Railway Recruitment Boards, NTPC, Group D, technical posts, official notifications.",
                        "Different railway posts can have different educational and medical requirements."
                    ),
                    make_lesson(
                        "Mathematics and General Intelligence",
                        "Practise foundational mathematics and reasoning.",
                        "Number systems, time and work, speed and distance, series, classification, direction sense.",
                        "A train travelling 60 kilometres in one hour has an average speed of 60 km/h."
                    ),
                    make_lesson(
                        "General Science and General Awareness",
                        "Review school-level science and general knowledge.",
                        "Physics, Chemistry, Biology, Indian Geography, History, Current Affairs.",
                        "Photosynthesis is the process through which green plants use light energy to prepare food."
                    ),
                ],
            ),

            make_course(
                "State PSC Preparation",
                "Prepare for State Public Service Commission examinations "
                "with state-specific subjects and administration.",
                "Beginner",
                [
                    make_lesson(
                        "Introduction to State Public Service Commissions",
                        "Understand State PSC examinations and their structure.",
                        "State PSC, civil services, preliminary examination, main examination, interview.",
                        "A State PSC may examine knowledge of state history, geography and administration."
                    ),
                    make_lesson(
                        "Indian Constitution and State Administration",
                        "Study constitutional foundations and state institutions.",
                        "Governor, Chief Minister, State Legislature, High Court, Local Government.",
                        "The Governor is the constitutional head of a state."
                    ),
                    make_lesson(
                        "State History, Geography and Current Affairs",
                        "Prepare state-specific general knowledge.",
                        "State formation, history, physical geography, economy, culture, government programmes.",
                        "A state's rivers, agricultural regions and industries are important geography topics."
                    ),
                ],
            ),

            make_course(
                "Defence Exams Preparation",
                "Explore Indian defence examination routes and their "
                "academic, physical and personality requirements.",
                "Beginner",
                [
                    make_lesson(
                        "Introduction to Defence Examinations",
                        "Understand major defence recruitment examination routes.",
                        "NDA, CDS, AFCAT, service selection, official recruitment notifications.",
                        "NDA, CDS and AFCAT are distinct entry routes with different eligibility requirements."
                    ),
                    make_lesson(
                        "Mathematics, English and General Knowledge",
                        "Build academic foundations useful for defence examinations.",
                        "Algebra, Trigonometry, Grammar, Comprehension, History, Geography, Science.",
                        "In basic trigonometry, sin 30 degrees equals one-half."
                    ),
                    make_lesson(
                        "Physical Fitness and Personality Development",
                        "Understand fitness, teamwork, communication and leadership.",
                        "Physical fitness, communication, teamwork, leadership, discipline.",
                        "A fitness routine can include suitable running, stretching and bodyweight exercises."
                    ),
                ],
            ),

            make_course(
                "General Studies and General Knowledge",
                "Develop knowledge of Indian history, geography, polity, "
                "economy and general science.",
                "Beginner",
                [
                    make_lesson(
                        "Indian History and National Movement",
                        "Study important periods and events in Indian history.",
                        "Ancient India, Medieval India, Modern India, reform movements, freedom struggle.",
                        "The Non-Cooperation Movement was launched in 1920."
                    ),
                    make_lesson(
                        "Indian Geography and Environment",
                        "Explore India's geography, climate and natural resources.",
                        "Himalayas, rivers, monsoon, soils, natural resources, biodiversity.",
                        "The southwest monsoon is a major source of seasonal rainfall in India."
                    ),
                    make_lesson(
                        "Indian Polity, Economy and Science",
                        "Understand government, economic and scientific concepts.",
                        "Constitution, Parliament, Fundamental Rights, GDP, inflation, basic science.",
                        "Inflation refers to a sustained increase in the general price level."
                    ),
                ],
            ),

            make_course(
                "Current Affairs for Competitive Exams",
                "Learn to follow national, international, economic and "
                "scientific developments for competitive examinations.",
                "Beginner",
                [
                    make_lesson(
                        "How to Read and Analyse News",
                        "Learn to identify relevant news and distinguish facts from opinions.",
                        "National news, international news, government decisions, editorials, fact checking.",
                        "For a government programme, identify its objective, beneficiaries and implementing ministry."
                    ),
                    make_lesson(
                        "Government Schemes, Reports and Important Events",
                        "Prepare notes on public programmes and important developments.",
                        "Government schemes, Union Budget, Economic Survey, reports, awards, important days.",
                        "For a scheme, record its purpose, beneficiaries and responsible ministry."
                    ),
                    make_lesson(
                        "Current Affairs Revision and Practice",
                        "Use revision and practice questions to retain current-affairs knowledge.",
                        "Monthly revision, topic-wise notes, quizzes, previous-year questions, source verification.",
                        "Organise news notes under polity, economy, environment, science and international relations."
                    ),
                ],
            ),
        ],
    },

    {
        "title": "Statistics and Data Analysis",
        "description": (
            "Study statistical foundations, descriptive statistics, "
            "probability, sampling, hypothesis testing, regression "
            "and practical data interpretation."
        ),
        "target_level": "Beginner",
        "courses": [

            make_course(
                "Fundamentals of Statistics",
                "Understand the meaning, scope, types and applications of statistics.",
                "Beginner",
                [
                    make_lesson(
                        "Introduction to Statistics",
                        "Learn how statistics helps collect, analyse and interpret data.",
                        "Statistics, data, population, sample, descriptive statistics, inferential statistics.",
                        "A college may survey 100 students to understand the study habits of its entire student population."
                    ),
                    make_lesson(
                        "Types and Sources of Data",
                        "Explore qualitative, quantitative and other data types.",
                        "Qualitative data, quantitative data, discrete data, continuous data, primary data, secondary data.",
                        "Student names are qualitative data, while student heights are quantitative continuous data."
                    ),
                    make_lesson(
                        "Organising and Presenting Data",
                        "Learn to organise observations into tables and graphs.",
                        "Frequency tables, class intervals, bar charts, histograms, pie charts.",
                        "A frequency table can show how many students scored within each examination-score interval."
                    ),
                ],
            ),

            make_course(
                "Descriptive Statistics",
                "Summarise datasets using central tendency and dispersion.",
                "Beginner",
                [
                    make_lesson(
                        "Mean, Median and Mode",
                        "Understand the three major measures of central tendency.",
                        "Arithmetic mean, median, mode, central tendency.",
                        "For 2, 4 and 6, the mean is 4 and the median is 4."
                    ),
                    make_lesson(
                        "Range, Variance and Standard Deviation",
                        "Measure the spread of observations in a dataset.",
                        "Range, variance, standard deviation, deviation from mean.",
                        "The range of 4, 7, 9, 12 and 15 is 11."
                    ),
                    make_lesson(
                        "Quartiles and Data Distribution",
                        "Explore position-based measures and distribution shapes.",
                        "Quartiles, interquartile range, percentiles, skewness, outliers.",
                        "The interquartile range is calculated as Q3 minus Q1."
                    ),
                ],
            ),

            make_course(
                "Probability and Probability Distributions",
                "Study probability rules, random variables and common distributions.",
                "Beginner",
                [
                    make_lesson(
                        "Basic Concepts of Probability",
                        "Understand experiments, outcomes and probability rules.",
                        "Random experiment, sample space, event, complement, addition rule.",
                        "For a fair coin, the probability of getting heads is one-half."
                    ),
                    make_lesson(
                        "Conditional Probability and Independence",
                        "Explore how one event can affect another event's probability.",
                        "Conditional probability, independent events, dependent events, multiplication rule.",
                        "Independent coin tosses do not change the probability of heads on the next toss."
                    ),
                    make_lesson(
                        "Common Probability Distributions",
                        "Learn discrete and continuous probability distributions.",
                        "Bernoulli distribution, binomial distribution, normal distribution, random variables.",
                        "The number of heads in a fixed number of independent coin tosses can follow a binomial distribution."
                    ),
                ],
            ),

            make_course(
                "Sampling Techniques",
                "Learn sampling methods and understand sampling errors and bias.",
                "Beginner",
                [
                    make_lesson(
                        "Population and Sampling Fundamentals",
                        "Understand populations, samples and sampling frames.",
                        "Population, sample, sampling frame, parameter, statistic.",
                        "A survey of 200 voters may estimate opinion across a much larger population."
                    ),
                    make_lesson(
                        "Probability Sampling Methods",
                        "Explore sampling methods with defined selection probabilities.",
                        "Simple random sampling, systematic sampling, stratified sampling, cluster sampling.",
                        "A college can divide students by year and select students from every year using stratified sampling."
                    ),
                    make_lesson(
                        "Non-Probability Sampling and Sampling Errors",
                        "Understand non-probability sampling and possible bias.",
                        "Convenience sampling, purposive sampling, quota sampling, sampling bias, non-sampling error.",
                        "Surveying only one classroom may produce a biased estimate of the entire college."
                    ),
                ],
            ),

            make_course(
                "Hypothesis Testing",
                "Learn the framework for testing statistical claims using sample data.",
                "Intermediate",
                [
                    make_lesson(
                        "Null and Alternative Hypotheses",
                        "Understand how to formulate statistical hypotheses.",
                        "Null hypothesis, alternative hypothesis, research question, one-tailed test, two-tailed test.",
                        "A test of whether the average differs from 60 may use H0: μ = 60 and H1: μ ≠ 60."
                    ),
                    make_lesson(
                        "Significance Level and P-value",
                        "Understand significance levels, p-values and statistical errors.",
                        "Significance level, p-value, Type I error, Type II error, statistical significance.",
                        "At a 5% significance level, a p-value of 0.03 leads to rejection of the null hypothesis under the usual rule."
                    ),
                    make_lesson(
                        "Basic Statistical Tests",
                        "Explore commonly used statistical tests.",
                        "Z-test, t-test, chi-square test, assumptions, statistical decisions.",
                        "A chi-square test can help examine association between categorical variables."
                    ),
                ],
            ),

            make_course(
                "Correlation and Regression",
                "Understand relationships between variables and model them using regression.",
                "Intermediate",
                [
                    make_lesson(
                        "Understanding Correlation",
                        "Learn how correlation describes association between variables.",
                        "Positive correlation, negative correlation, zero correlation, scatter plot, correlation coefficient.",
                        "Study time and examination scores may have a positive association, but correlation does not prove causation."
                    ),
                    make_lesson(
                        "Simple Linear Regression",
                        "Understand the linear regression equation.",
                        "Dependent variable, independent variable, regression line, slope, intercept.",
                        "In y = 2 + 3x, the predicted value of y is 11 when x equals 3."
                    ),
                    make_lesson(
                        "Regression Evaluation and Limitations",
                        "Explore model fit, residuals and prediction limitations.",
                        "Residuals, R-squared, prediction, outliers, extrapolation.",
                        "A high R-squared value does not by itself prove that a model is appropriate or causal."
                    ),
                ],
            ),

            make_course(
                "Statistical Inference",
                "Study estimation, confidence intervals and statistical conclusions.",
                "Intermediate",
                [
                    make_lesson(
                        "Estimation and Sampling Distributions",
                        "Understand how sample statistics estimate population parameters.",
                        "Point estimate, interval estimate, sampling distribution, standard error.",
                        "The sample mean can be used as a point estimate of the population mean."
                    ),
                    make_lesson(
                        "Confidence Intervals",
                        "Learn how confidence intervals express uncertainty.",
                        "Confidence level, margin of error, confidence interval, interpretation.",
                        "A confidence interval provides a range of plausible values for a population parameter under the method's assumptions."
                    ),
                    make_lesson(
                        "Inference, Assumptions and Conclusions",
                        "Understand the assumptions behind statistical inference.",
                        "Randomness, independence, distributional assumptions, uncertainty, practical significance.",
                        "A statistically significant result may still be too small to matter in a practical decision."
                    ),
                ],
            ),

            make_course(
                "Data Interpretation and Quantitative Aptitude",
                "Interpret tables, charts, percentages, ratios and numerical information.",
                "Beginner",
                [
                    make_lesson(
                        "Interpreting Tables and Charts",
                        "Learn to extract information from common data displays.",
                        "Data tables, bar charts, line graphs, pie charts, comparisons.",
                        "A monthly sales graph can help identify increases, decreases and seasonal patterns."
                    ),
                    make_lesson(
                        "Percentages, Ratios and Averages",
                        "Apply numerical techniques to practical data problems.",
                        "Percentage change, ratio, proportion, average, weighted average.",
                        "An increase from 80 to 100 is a 25% increase."
                    ),
                    make_lesson(
                        "Case-Based Data Interpretation Practice",
                        "Combine quantitative skills to solve multi-step questions.",
                        "Caselets, missing data, comparative analysis, multi-step calculations, estimation.",
                        "A department-wise enrolment table can be used to calculate totals, averages and percentage shares."
                    ),
                ],
            ),
        ],
    },
]


# --------------------------------------------------
# VALIDATE CATALOGUE
# --------------------------------------------------

assert len(LEARNING_CONTENT) == 2
assert sum(len(p["courses"]) for p in LEARNING_CONTENT) == 16
assert all(
    len(c["lessons"]) == 3
    for p in LEARNING_CONTENT
    for c in p["courses"]
)
assert len({
    c["title"]
    for p in LEARNING_CONTENT
    for c in p["courses"]
}) == 16


# --------------------------------------------------
# DATABASE HELPERS
# --------------------------------------------------

def get_or_create_path(db, path_data):
    path = (
        db.query(LearningPath)
        .filter(
            LearningPath.instructor_id == OWNER_ID,
            LearningPath.title == path_data["title"],
        )
        .first()
    )

    if path:
        path.description = path_data["description"]
        path.target_level = path_data["target_level"]
        path.is_published = True
        return path, False

    path = LearningPath(
        title=path_data["title"],
        description=path_data["description"],
        instructor_id=OWNER_ID,
        target_level=path_data["target_level"],
        is_published=True,
    )

    db.add(path)
    db.flush()

    return path, True


def get_or_create_course(db, course_data, category):
    course = (
        db.query(Course)
        .filter(
            Course.instructor_id == OWNER_ID,
            Course.title == course_data["title"],
        )
        .first()
    )

    if course:
        course.description = course_data["description"]
        course.category = category
        course.level = course_data["level"]
        course.price = 0
        course.is_published = True
        return course, False

    course = Course(
        title=course_data["title"],
        description=course_data["description"],
        category=category,
        instructor_id=OWNER_ID,
        price=0,
        level=course_data["level"],
        is_published=True,
    )

    db.add(course)
    db.flush()

    return course, True


def add_lessons(db, course, lesson_data):
    created = 0
    skipped = 0

    next_order = (
        db.query(func.max(Lesson.order_index))
        .filter(Lesson.course_id == course.id)
        .scalar()
        or 0
    ) + 1

    for lesson_info in lesson_data:
        existing = (
            db.query(Lesson)
            .filter(
                Lesson.course_id == course.id,
                Lesson.title == lesson_info["title"],
            )
            .first()
        )

        if existing:
            skipped += 1
            continue

        content = f"""# {lesson_info['title']}

## Introduction

{lesson_info['description']}

## Key Concepts

{lesson_info['concepts']}

## Practical Example

{lesson_info['example']}

## Hands-on Exercise

{lesson_info['exercise']}

## Learning Outcome

{lesson_info['outcome']}

## Summary

Review the concepts and complete the exercise.
"""

        lesson = Lesson(
            course_id=course.id,
            title=lesson_info["title"],
            description=lesson_info["description"],
            content=content,
            video_url=None,
            duration_minutes=30,
            order_index=next_order,
            is_preview=(next_order == 1),
        )

        db.add(lesson)
        next_order += 1
        created += 1

    return created, skipped


# --------------------------------------------------
# MAIN SEED FUNCTION
# --------------------------------------------------

def seed():
    db = SessionLocal()

    counts = {
        "old_courses_unpublished": 0,
        "old_paths_unpublished": 0,
        "paths_created": 0,
        "paths_existing": 0,
        "courses_created": 0,
        "courses_existing": 0,
        "lessons_created": 0,
        "lessons_existing": 0,
        "links_created": 0,
        "links_existing": 0,
    }

    try:
        from app.models.user import User

        owner = db.get(User, OWNER_ID)

        if owner is None:
            raise ValueError(
                f"User ID {OWNER_ID} does not exist."
            )

        print(
            f"Preparing content for {owner.full_name} "
            f"(ID {owner.id})"
        )

        # Unpublish old published courses.
        new_course_titles = {
            course["title"]
            for path in LEARNING_CONTENT
            for course in path["courses"]
        }

        old_courses = (
            db.query(Course)
            .filter(
                Course.instructor_id == OWNER_ID,
                Course.is_published.is_(True),
            )
            .all()
        )

        for course in old_courses:
            if course.title not in new_course_titles:
                course.is_published = False
                counts["old_courses_unpublished"] += 1

        # Unpublish old published learning paths.
        new_path_titles = {
            path["title"] for path in LEARNING_CONTENT
        }

        old_paths = (
            db.query(LearningPath)
            .filter(
                LearningPath.instructor_id == OWNER_ID,
                LearningPath.is_published.is_(True),
            )
            .all()
        )

        for path in old_paths:
            if path.title not in new_path_titles:
                path.is_published = False
                counts["old_paths_unpublished"] += 1

        # Create or update the new catalogue.
        for path_data in LEARNING_CONTENT:
            path, created = get_or_create_path(db, path_data)

            if created:
                counts["paths_created"] += 1
            else:
                counts["paths_existing"] += 1

            for course_data in path_data["courses"]:
                course, created = get_or_create_course(
                    db,
                    course_data,
                    path_data["title"],
                )

                if created:
                    counts["courses_created"] += 1
                else:
                    counts["courses_existing"] += 1

                # Link course to learning path.
                link = (
                    db.query(LearningPathCourse)
                    .filter(
                        LearningPathCourse.learning_path_id == path.id,
                        LearningPathCourse.course_id == course.id,
                    )
                    .first()
                )

                if link:
                    counts["links_existing"] += 1
                else:
                    current_max = (
                        db.query(func.max(LearningPathCourse.order_index))
                        .filter(
                            LearningPathCourse.learning_path_id == path.id
                        )
                        .scalar()
                        or 0
                    )

                    db.add(
                        LearningPathCourse(
                            learning_path_id=path.id,
                            course_id=course.id,
                            order_index=current_max + 1,
                        )
                    )

                    counts["links_created"] += 1

                # Add lessons without duplicating existing lessons.
                lesson_created, lesson_existing = add_lessons(
                    db,
                    course,
                    course_data["lessons"],
                )

                counts["lessons_created"] += lesson_created
                counts["lessons_existing"] += lesson_existing

        # Save all changes together.
        db.commit()

        print("\nCONTENT SEEDING COMPLETED")
        print("-" * 45)

        for key, value in counts.items():
            print(f"{key}: {value}")

        print("-" * 45)

        print("Final published courses:")
        print(
            db.query(Course)
            .filter(
                Course.instructor_id == OWNER_ID,
                Course.is_published.is_(True),
            )
            .count()
        )

        print("Final published learning paths:")
        print(
            db.query(LearningPath)
            .filter(
                LearningPath.instructor_id == OWNER_ID,
                LearningPath.is_published.is_(True),
            )
            .count()
        )

        print("Total existing lessons preserved:")
        print(db.query(Lesson).count())

    except Exception:
        db.rollback()
        print(
            "Seeding failed. Database changes from this run "
            "were rolled back."
        )
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()
