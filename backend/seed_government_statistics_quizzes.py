"""
Seed one practice quiz for each of Statskill's 16 new Government Exams
and Statistics courses (course IDs 18-33, instructor ID 8).

Safety:
- Creates quizzes only for the listed courses owned by OWNER_ID.
- Skips a course if it already has ANY quiz.
- Does not edit or delete existing quizzes, questions, or attempts.
- Safe to rerun: already-seeded courses are skipped.
Run from the backend directory:
    python seed_government_statistics_quizzes.py
"""

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.course import Course
from app.models.quiz import Quiz
from app.models.question import Question

OWNER_ID = 8

# Each course has 8 MCQs followed by 2 True/False questions.
# Format: (question_text, question_type, options, correct_answer)
QUIZ_CONTENT = {
    18: {
        "title": "UPSC Civil Services Preparation - Practice Quiz",
        "description": "Test your understanding of the UPSC examination structure, Constitution, governance, and preparation strategy.",
        "questions": [
            ("Which body conducts the Civil Services Examination for recruitment to services such as the IAS and IPS?", "MCQ", ["Union Public Service Commission", "Staff Selection Commission", "Election Commission of India", "Finance Commission"], "Union Public Service Commission"),
            ("Which stage of the Civil Services Examination is primarily used as a screening test for the Main Examination?", "MCQ", ["Personality Test", "Preliminary Examination", "Main Examination", "Training"], "Preliminary Examination"),
            ("How many papers are counted for the merit ranking in the UPSC Civil Services Main Examination, excluding the qualifying language papers?", "MCQ", ["Four", "Five", "Seven", "Nine"], "Seven"),
            ("Which part of the Indian Constitution contains the Fundamental Rights?", "MCQ", ["Part II", "Part III", "Part IV", "Part IVA"], "Part III"),
            ("The Directive Principles of State Policy are primarily contained in which part of the Constitution?", "MCQ", ["Part III", "Part IV", "Part V", "Part VI"], "Part IV"),
            ("Who appoints the Governor of an Indian state?", "MCQ", ["Chief Minister", "Chief Justice of the High Court", "President of India", "Speaker of the Legislative Assembly"], "President of India"),
            ("Which of the following is a constitutional body?", "MCQ", ["NITI Aayog", "Union Public Service Commission", "National Development Council", "Central Vigilance Commission"], "Union Public Service Commission"),
            ("What is the main purpose of solving previous-year question papers during preparation?", "MCQ", ["To avoid studying the syllabus", "To understand question patterns and assess preparation", "To guarantee identical questions", "To replace revision completely"], "To understand question patterns and assess preparation"),
            ("The Constitution of India came into force on 26 January 1950.", "TRUE_FALSE", None, "True"),
            ("The President of India is directly elected by all citizens through a nationwide popular vote.", "TRUE_FALSE", None, "False"),
        ],
    },
    19: {
        "title": "SSC CGL and CHSL Preparation - Practice Quiz",
        "description": "Practise arithmetic, reasoning, English, and general awareness concepts relevant to SSC examinations.",
        "questions": [
            ("If 20% of a number is 50, what is the number?", "MCQ", ["100", "150", "200", "250"], "250"),
            ("A shopkeeper buys an item for ₹800 and sells it for ₹920. What is the profit percentage?", "MCQ", ["10%", "12%", "15%", "20%"], "15%"),
            ("The average of 12, 18, and 24 is:", "MCQ", ["16", "18", "20", "22"], "18"),
            ("Choose the next number in the series: 3, 6, 12, 24, __.", "MCQ", ["30", "36", "42", "48"], "48"),
            ("Which word is closest in meaning to 'abundant'?", "MCQ", ["Scarce", "Plentiful", "Tiny", "Empty"], "Plentiful"),
            ("Choose the grammatically correct sentence.", "MCQ", ["She do her work daily.", "She does her work daily.", "She doing her work daily.", "She done her work daily."], "She does her work daily."),
            ("A train covers 180 km in 3 hours. What is its average speed?", "MCQ", ["45 km/h", "50 km/h", "60 km/h", "75 km/h"], "60 km/h"),
            ("If A is taller than B and B is taller than C, who is the shortest?", "MCQ", ["A", "B", "C", "Cannot be determined"], "C"),
            ("The Staff Selection Commission conducts recruitment examinations for various central government posts.", "TRUE_FALSE", None, "True"),
            ("An increase from 100 to 120 represents a .close 10% increase.", "TRUE_FALSE", None, "False"),
        ],
    },
    20: {
        "title": "Banking Exams Preparation - Practice Quiz",
        "description": "Assess your knowledge of banking institutions, financial awareness, aptitude, and banking examination concepts.",
        "questions": [
            ("What is the full form of RBI?", "MCQ", ["Reserve Bank of India", "Rural Banking Institution", "Regional Bank of India", "Reserve Bureau of Investment"], "Reserve Bank of India"),
            ("Which institution is India's central bank?", "MCQ", ["State Bank of India", "Reserve Bank of India", "NABARD", "Punjab National Bank"], "Reserve Bank of India"),
            ("Simple interest on ₹2,000 at 5% per annum for 2 years is:", "MCQ", ["₹100", "₹150", "₹200", "₹250"], "₹200"),
            ("Which payment system enables immediate interbank fund transfers in India?", "MCQ", ["NEFT only", "RTGS only", "IMPS", "All paper cheques"], "IMPS"),
            ("A sum of ₹500 is divided in the ratio 2:3. What is the larger share?", "MCQ", ["₹100", "₹200", "₹300", "₹400"], "₹300"),
            ("Which organisation provides refinance and development support for agriculture and rural development?", "MCQ", ["SEBI", "NABARD", "IRDAI", "TRAI"], "NABARD"),
            ("What does KYC stand for in banking?", "MCQ", ["Keep Your Cash", "Know Your Customer", "Know Your Credit", "Keep Your Customer"], "Know Your Customer"),
            ("If deposits are ₹80,000 and withdrawals are ₹25,000, the net increase in deposits is:", "MCQ", ["₹45,000", "₹50,000", "₹55,000", "₹60,000"], "₹55,000"),
            ("The Reserve Bank of India issues most banknotes in India.", "TRUE_FALSE", None, "True"),
            ("A higher repo rate generally makes borrowing from the central bank cheaper for commercial banks.", "TRUE_FALSE", None, "False"),
        ],
    },
    21: {
        "title": "Railway Exams Preparation - Practice Quiz",
        "description": "Practise railway recruitment topics including mathematics, reasoning, general science, and railway awareness.",
        "questions": [
            ("A train travels 150 km in 2.5 hours. Its average speed is:", "MCQ", ["50 km/h", "55 km/h", "60 km/h", "65 km/h"], "60 km/h"),
            ("If 8 workers complete a task in 12 days, how many worker-days are required?", "MCQ", ["20", "48", "96", "120"], "96"),
            ("Find the next number: 5, 10, 20, 40, __.", "MCQ", ["45", "60", "70", "80"], "80"),
            ("Which gas is essential for human respiration?", "MCQ", ["Nitrogen", "Oxygen", "Carbon dioxide", "Hydrogen"], "Oxygen"),
            ("The SI unit of force is:", "MCQ", ["Joule", "Watt", "Newton", "Pascal"], "Newton"),
            ("Which part of a plant mainly absorbs water from the soil?", "MCQ", ["Flower", "Leaf", "Root", "Fruit"], "Root"),
            ("A train 120 metres long crosses a pole in 6 seconds. Its speed is:", "MCQ", ["10 m/s", "15 m/s", "20 m/s", "25 m/s"], "20 m/s"),
            ("Which organisation is responsible for managing India's railway network at the national level?", "MCQ", ["Ministry of Railways", "Ministry of Road Transport only", "NITI Aayog", "Election Commission"], "Ministry of Railways"),
            ("The boiling point of pure water at standard atmospheric pressure is 100°C.", "TRUE_FALSE", None, "True"),
            ("Sound travels faster in air than in steel.", "TRUE_FALSE", None, "False"),
        ],
    },
    22: {
        "title": "State PSC Preparation - Practice Quiz",
        "description": "Review Indian polity, state administration, public services, and state-focused examination fundamentals.",
        "questions": [
            ("Who is the constitutional head of a state in India?", "MCQ", ["Chief Minister", "Governor", "Chief Secretary", "Speaker"], "Governor"),
            ("Who is generally the head of the elected state government?", "MCQ", ["Governor", "Chief Minister", "President", "Advocate General"], "Chief Minister"),
            ("The State Public Service Commission is provided for under which Article of the Constitution?", "MCQ", ["Article 280", "Article 315", "Article 324", "Article 356"], "Article 315"),
            ("Which schedule of the Constitution lists recognised languages?", "MCQ", ["Fifth Schedule", "Sixth Schedule", "Eighth Schedule", "Tenth Schedule"], "Eighth Schedule"),
            ("Who appoints the Chief Minister of a state?", "MCQ", ["President", "Governor", "Chief Justice of India", "State Election Commissioner"], "Governor"),
            ("Which local government institution operates at the village level in the Panchayati Raj system?", "MCQ", ["Municipal Corporation", "Gram Panchayat", "Zila Parishad only", "Town Council"], "Gram Panchayat"),
            ("Which constitutional amendment gave constitutional status to Panchayati Raj institutions?", "MCQ", ["42nd", "44th", "73rd", "74th"], "73rd"),
            ("A state budget is presented in the:", "MCQ", ["State Legislature", "Supreme Court", "Election Commission", "Union Public Service Commission"], "State Legislature"),
            ("The Governor is appointed by the President of India.", "TRUE_FALSE", None, "True"),
            ("Every state in India has exactly the same number of seats in its Legislative Assembly.", "TRUE_FALSE", None, "False"),
        ],
    },
    23: {
        "title": "Defence Exams Preparation - Practice Quiz",
        "description": "Test foundational knowledge of Indian defence services, national security, and defence examination awareness.",
        "questions": [
            ("Which branch of the Indian Armed Forces is primarily responsible for maritime defence?", "MCQ", ["Indian Army", "Indian Navy", "Indian Air Force", "Coast Guard alone"], "Indian Navy"),
            ("The National Defence Academy is located at:", "MCQ", ["Dehradun", "Khadakwasla near Pune", "Chennai", "Hyderabad"], "Khadakwasla near Pune"),
            ("Which force primarily operates military aircraft for air defence?", "MCQ", ["Indian Navy", "Indian Air Force", "Border Security Force", "Central Reserve Police Force"], "Indian Air Force"),
            ("What is the full form of NDA in the context of defence education?", "MCQ", ["National Defence Academy", "National Development Authority", "Naval Defence Association", "National Duty Academy"], "National Defence Academy"),
            ("Which ministry is responsible for India's defence policy and administration?", "MCQ", ["Ministry of Home Affairs", "Ministry of Defence", "Ministry of External Affairs", "Ministry of Finance"], "Ministry of Defence"),
            ("Which organisation is associated with India's defence research and development?", "MCQ", ["DRDO", "ISRO only", "SEBI", "FSSAI"], "DRDO"),
            ("The Indian Army's primary role includes:", "MCQ", ["Land-based defence", "Monetary policy", "Conducting elections", "Regulating stock exchanges"], "Land-based defence"),
            ("Which examination is commonly associated with entry into officer training for graduates in the armed forces?", "MCQ", ["CDS", "CGL", "CHSL", "CPO only"], "CDS"),
            ("The Indian Armed Forces include the Army, Navy, and Air Force.", "TRUE_FALSE", None, "True"),
            ("The Indian Coast Guard is the same organisation as the Indian Air Force.", "TRUE_FALSE", None, "False"),
        ],
    },
    24: {
        "title": "General Studies and General Knowledge - Practice Quiz",
        "description": "Check foundational knowledge of Indian history, geography, polity, science, and general awareness.",
        "questions": [
            ("Who was the first President of independent India?", "MCQ", ["Jawaharlal Nehru", "Dr. Rajendra Prasad", "Sardar Vallabhbhai Patel", "Dr. S. Radhakrishnan"], "Dr. Rajendra Prasad"),
            ("Which is the largest Indian state by area?", "MCQ", ["Madhya Pradesh", "Maharashtra", "Rajasthan", "Uttar Pradesh"], "Rajasthan"),
            ("The Tropic of Cancer passes through how many Indian states?", "MCQ", ["Six", "Seven", "Eight", "Nine"], "Eight"),
            ("Who founded the Maurya Empire?", "MCQ", ["Ashoka", "Chandragupta Maurya", "Bindusara", "Harsha"], "Chandragupta Maurya"),
            ("Which is the lower house of the Indian Parliament?", "MCQ", ["Rajya Sabha", "Lok Sabha", "Vidhan Parishad", "Gram Sabha"], "Lok Sabha"),
            ("Which vitamin is produced in the skin when exposed to sunlight?", "MCQ", ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], "Vitamin D"),
            ("What is the chemical symbol for sodium?", "MCQ", ["So", "S", "Na", "N"], "Na"),
            ("Which river is commonly called the Dakshin Ganga?", "MCQ", ["Narmada", "Godavari", "Krishna", "Kaveri"], "Godavari"),
            ("The Indian Constitution was adopted on 26 November 1949.", "TRUE_FALSE", None, "True"),
            ("The Equator passes through mainland India.", "TRUE_FALSE", None, "False"),
        ],
    },
    25: {
        "title": "Current Affairs for Competitive Exams - Practice Quiz",
        "description": "Practise reliable current-affairs study methods, public institutions, international organisations, and economic terminology.",
        "questions": [
            ("Which official source is most appropriate for verifying a Government of India scheme announcement?", "MCQ", ["An unverified social media post", "The relevant ministry's official website or PIB release", "An anonymous message", "An unrelated discussion forum"], "The relevant ministry's official website or PIB release"),
            ("What does GDP measure?", "MCQ", ["The total value of final goods and services produced within a country during a period", "Only government tax revenue", "Only exports", "The number of people employed"], "The total value of final goods and services produced within a country during a period"),
            ("Which organisation publishes the World Economic Outlook?", "MCQ", ["World Bank", "International Monetary Fund", "World Trade Organization", "UNESCO"], "International Monetary Fund"),
            ("Which United Nations body is primarily responsible for international peace and security?", "MCQ", ["Security Council", "UNICEF", "WHO", "ILO"], "Security Council"),
            ("What is inflation?", "MCQ", ["A sustained rise in the general price level", "A fall in population", "A rise in rainfall", "A reduction in all prices"], "A sustained rise in the general price level"),
            ("Which Indian institution releases monetary policy decisions?", "MCQ", ["Election Commission", "Reserve Bank of India", "Union Public Service Commission", "CAG"], "Reserve Bank of India"),
            ("What is the main purpose of a budget?", "MCQ", ["To present estimated receipts and expenditure", "To announce election results", "To publish court judgments", "To conduct a population census"], "To present estimated receipts and expenditure"),
            ("Which practice improves the reliability of current-affairs notes?", "MCQ", ["Recording the date and checking primary sources", "Copying headlines without context", "Using only old forwarded messages", "Ignoring corrections"], "Recording the date and checking primary sources"),
            ("The World Health Organization is a specialised agency of the United Nations.", "TRUE_FALSE", None, "True"),
            ("A country's fiscal deficit is always the same as its trade deficit.", "TRUE_FALSE", None, "False"),
        ],
    },
    26: {
        "title": "Fundamentals of Statistics - Practice Quiz",
        "description": "Assess your understanding of statistical data, variables, populations, samples, and basic methods.",
        "questions": [
            ("Statistics is primarily concerned with:", "MCQ", ["Collecting, organising, analysing, and interpreting data", "Studying planets only", "Writing computer hardware", "Measuring distance only"], "Collecting, organising, analysing, and interpreting data"),
            ("A complete group of individuals or items under study is called the:", "MCQ", ["Sample", "Population", "Statistic", "Frequency"], "Population"),
            ("A subset selected from a population is called a:", "MCQ", ["Parameter", "Census", "Sample", "Variable"], "Sample"),
            ("Which of the following is a qualitative variable?", "MCQ", ["Height in centimetres", "Age in years", "Blood group", "Monthly income"], "Blood group"),
            ("The number of students in a class is an example of:", "MCQ", ["Continuous data", "Discrete data", "Nominal data only", "A parameter"], "Discrete data"),
            ("Which scale of measurement has categories with no natural order?", "MCQ", ["Nominal", "Ordinal", "Interval", "Ratio"], "Nominal"),
            ("A numerical measure describing a population is called a:", "MCQ", ["Statistic", "Parameter", "Sample", "Class interval"], "Parameter"),
            ("Which method collects information from every unit in a population?", "MCQ", ["Sample survey", "Census", "Convenience sampling", "Pilot study"], "Census"),
            ("A sample statistic can be used to estimate a population parameter.", "TRUE_FALSE", None, "True"),
            ("Every variable must be numerical.", "TRUE_FALSE", None, "False"),
        ],
    },
    27: {
        "title": "Descriptive Statistics - Practice Quiz",
        "description": "Practise measures of central tendency, dispersion, position, and graphical presentation of data.",
        "questions": [
            ("What is the arithmetic mean of 2, 4, 6, and 8?", "MCQ", ["4", "5", "6", "7"], "5"),
            ("What is the median of 3, 5, 7, 9, and 11?", "MCQ", ["5", "7", "8", "9"], "7"),
            ("What is the mode of 2, 3, 3, 4, 5?", "MCQ", ["2", "3", "4", "5"], "3"),
            ("The range of a dataset is calculated as:", "MCQ", ["Maximum minus minimum", "Maximum plus minimum", "Mean divided by median", "Sum divided by count"], "Maximum minus minimum"),
            ("Which measure of central tendency is generally most affected by extreme values?", "MCQ", ["Median", "Mode", "Arithmetic mean", "Quartile"], "Arithmetic mean"),
            ("The standard deviation is the positive square root of the:", "MCQ", ["Mean", "Variance", "Range", "Median"], "Variance"),
            ("Which graph is commonly used to display the frequency distribution of continuous data?", "MCQ", ["Histogram", "Pie chart only", "Pictogram only", "Flowchart"], "Histogram"),
            ("If every observation in a dataset is increased by 5, the mean:", "MCQ", ["Decreases by 5", "Increases by 5", "Remains unchanged", "Doubles"], "Increases by 5"),
            ("The median divides an ordered dataset into two halves.", "TRUE_FALSE", None, "True"),
            ("The range uses every observation in a dataset in its calculation.", "TRUE_FALSE", None, "False"),
        ],
    },
    28: {
        "title": "Probability and Probability Distributions - Practice Quiz",
        "description": "Test basic probability rules and common discrete and continuous probability distributions.",
        "questions": [
            ("The probability of an event that is certain is:", "MCQ", ["0", "0.25", "0.5", "1"], "1"),
            ("A fair coin is tossed once. What is the probability of getting heads?", "MCQ", ["0", "1/4", "1/2", "1"], "1/2"),
            ("A fair six-sided die is rolled. What is the probability of obtaining an even number?", "MCQ", ["1/6", "1/3", "1/2", "2/3"], "1/2"),
            ("If P(A) = 0.3, what is P(not A)?", "MCQ", ["0.3", "0.5", "0.7", "1.3"], "0.7"),
            ("For two independent events A and B, P(A and B) equals:", "MCQ", ["P(A) + P(B)", "P(A) × P(B)", "P(A) − P(B)", "P(A) / P(B)"], "P(A) × P(B)"),
            ("Which distribution is commonly used to model the number of successes in a fixed number of independent trials with constant success probability?", "MCQ", ["Binomial", "Normal", "Uniform continuous", "Exponential only"], "Binomial"),
            ("The normal distribution is:", "MCQ", ["Symmetric and bell-shaped", "Always skewed right", "Always discrete", "Uniform over all real numbers"], "Symmetric and bell-shaped"),
            ("The expected value of a fair six-sided die roll is:", "MCQ", ["2.5", "3", "3.5", "4"], "3.5"),
            ("The probability of an event is always between 0 and 1 inclusive.", "TRUE_FALSE", None, "True"),
            ("If two events are mutually exclusive, they must occur together.", "TRUE_FALSE", None, "False"),
        ],
    },
    29: {
        "title": "Sampling Techniques - Practice Quiz",
        "description": "Evaluate your understanding of probability sampling, non-probability sampling, sampling error, and survey design.",
        "questions": [
            ("In simple random sampling, each population member has:", "MCQ", ["A known and equal chance of selection", "No chance of selection", "A chance based only on convenience", "A guaranteed place in the sample"], "A known and equal chance of selection"),
            ("Dividing a population into groups and sampling from every group is called:", "MCQ", ["Stratified sampling", "Convenience sampling", "Snowball sampling", "Purposive sampling"], "Stratified sampling"),
            ("Selecting every 10th name from an ordered list is an example of:", "MCQ", ["Cluster sampling", "Systematic sampling", "Quota sampling", "Snowball sampling"], "Systematic sampling"),
            ("In cluster sampling, the population is divided into:", "MCQ", ["Clusters", "Percentiles", "Variables", "Experiments"], "Clusters"),
            ("Which is a non-probability sampling method?", "MCQ", ["Simple random sampling", "Stratified random sampling", "Convenience sampling", "Systematic random sampling"], "Convenience sampling"),
            ("A sampling frame is:", "MCQ", ["A list or operational representation of population units", "The final statistical conclusion", "A type of graph", "The calculated mean"], "A list or operational representation of population units"),
            ("A larger sample size generally reduces which type of error, all else equal?", "MCQ", ["Sampling error", "All possible measurement errors", "Every form of bias", "Data-entry errors automatically"], "Sampling error"),
            ("Non-response bias may occur when:", "MCQ", ["Selected participants who do not respond differ systematically from respondents", "Every selected participant responds", "Data are measured perfectly", "A census is conducted"], "Selected participants who do not respond differ systematically from respondents"),
            ("Stratified sampling can help ensure representation of important population subgroups.", "TRUE_FALSE", None, "True"),
            ("Convenience sampling always produces a representative sample.", "TRUE_FALSE", None, "False"),
        ],
    },
    30: {
        "title": "Hypothesis Testing - Practice Quiz",
        "description": "Practise null and alternative hypotheses, significance levels, p-values, and Type I and Type II errors.",
        "questions": [
            ("The null hypothesis is commonly denoted by:", "MCQ", ["H₀", "H₁", "μ only", "σ² only"], "H₀"),
            ("The alternative hypothesis is commonly denoted by:", "MCQ", ["H₀", "H₁", "n", "α"], "H₁"),
            ("The significance level is commonly represented by:", "MCQ", ["β", "α", "μ", "s"], "α"),
            ("A p-value is the probability, assuming the null hypothesis is true, of obtaining a result at least as extreme as the observed result.", "MCQ", ["A correct interpretation", "The probability that H₀ is true", "The probability that the sample mean is zero", "The probability of a Type II error"], "A correct interpretation"),
            ("If the p-value is 0.03 and α = 0.05, the usual decision is to:", "MCQ", ["Reject H₀", "Fail to reject H₀", "Increase the sample mean", "Accept that H₀ is certainly true"], "Reject H₀"),
            ("A Type I error occurs when we:", "MCQ", ["Reject a true null hypothesis", "Fail to reject a false null hypothesis", "Use a large sample", "Calculate the median"], "Reject a true null hypothesis"),
            ("A Type II error occurs when we:", "MCQ", ["Reject a true null hypothesis", "Fail to reject a false null hypothesis", "Reject every hypothesis", "Set α equal to zero"], "Fail to reject a false null hypothesis"),
            ("A two-tailed test is appropriate when the alternative hypothesis tests for:", "MCQ", ["A difference in either direction", "Only an increase", "Only a decrease", "No variation"], "A difference in either direction"),
            ("A small p-value can provide evidence against the null hypothesis.", "TRUE_FALSE", None, "True"),
            ("Failing to reject the null hypothesis proves that it is true.", "TRUE_FALSE", None, "False"),
        ],
    },
    31: {
        "title": "Correlation and Regression - Practice Quiz",
        "description": "Check your understanding of correlation, scatterplots, regression lines, and interpretation of relationships.",
        "questions": [
            ("The correlation coefficient measures the:", "MCQ", ["Strength and direction of a linear relationship", "Difference between two medians", "Total number of observations", "Causal effect in every situation"], "Strength and direction of a linear relationship"),
            ("The value of Pearson's correlation coefficient lies between:", "MCQ", ["0 and 1", "-1 and 1", "-10 and 10", "0 and 100"], "-1 and 1"),
            ("A correlation coefficient of +1 indicates:", "MCQ", ["Perfect positive linear correlation", "No linear correlation", "Perfect negative linear correlation", "A nonlinear relationship only"], "Perfect positive linear correlation"),
            ("A correlation coefficient close to 0 indicates:", "MCQ", ["Little or no linear association", "Perfect positive association", "Perfect negative association", "Proof of independence in every case"], "Little or no linear association"),
            ("In simple linear regression, the dependent variable is commonly denoted by:", "MCQ", ["X", "Y", "r", "n"], "Y"),
            ("The least-squares regression line is fitted by minimising the:", "MCQ", ["Sum of squared residuals", "Sum of X values", "Number of variables", "Sample size"], "Sum of squared residuals"),
            ("If two variables have a negative correlation, as one tends to increase the other tends to:", "MCQ", ["Increase", "Decrease", "Remain exactly constant", "Become categorical"], "Decrease"),
            ("Which graph is useful for visually examining the relationship between two quantitative variables?", "MCQ", ["Scatterplot", "Pie chart", "Bar chart of categories only", "Flow diagram"], "Scatterplot"),
            ("Correlation by itself establishes that one variable causes the other.", "TRUE_FALSE", None, "False"),
            ("A regression equation can be used to estimate a response for a given predictor value, within appropriate limits.", "TRUE_FALSE", None, "True"),
        ],
    },
    32: {
        "title": "Statistical Inference - Practice Quiz",
        "description": "Review estimation, confidence intervals, sampling distributions, and the logic of statistical inference.",
        "questions": [
            ("Statistical inference uses sample information to draw conclusions about a:", "MCQ", ["Population", "Single graph only", "Calculator", "Data-entry form"], "Population"),
            ("A point estimate is:", "MCQ", ["A single numerical estimate of a population parameter", "A range of all possible values", "A sampling frame", "A type of census"], "A single numerical estimate of a population parameter"),
            ("A confidence interval provides:", "MCQ", ["A range of plausible values for a population parameter under a stated procedure", "The exact parameter with certainty", "A list of all sample observations", "A guarantee that the sample has no bias"], "A range of plausible values for a population parameter under a stated procedure"),
            ("For a fixed method, increasing the confidence level generally makes the confidence interval:", "MCQ", ["Wider", "Narrower", "Always zero width", "Unchanged in every case"], "Wider"),
            ("The standard error describes the:", "MCQ", ["Standard deviation of a statistic's sampling distribution", "Range of raw observations", "Population size", "Largest observation"], "Standard deviation of a statistic's sampling distribution"),
            ("The Central Limit Theorem concerns the approximate distribution of:", "MCQ", ["Sample means under suitable conditions", "Only the sample maximum", "Every individual observation", "Only categorical labels"], "Sample means under suitable conditions"),
            ("An unbiased estimator has expected value equal to the:", "MCQ", ["Population parameter being estimated", "Sample size", "Largest sample value", "Significance level"], "Population parameter being estimated"),
            ("If the sample size increases, the standard error of the sample mean generally:", "MCQ", ["Decreases", "Increases without limit", "Must equal the population mean", "Becomes negative"], "Decreases"),
            ("A 95% confidence level refers to the long-run coverage of the interval procedure under its assumptions.", "TRUE_FALSE", None, "True"),
            ("A confidence interval eliminates all forms of sampling and non-sampling error.", "TRUE_FALSE", None, "False"),
        ],
    },
    33: {
        "title": "Data Interpretation and Quantitative Aptitude - Practice Quiz",
        "description": "Practise percentage change, ratios, averages, tables, and quantitative interpretation used in competitive examinations.",
        "questions": [
            ("A value increases from 200 to 250. What is the percentage increase?", "MCQ", ["20%", "25%", "30%", "50%"], "25%"),
            ("The ratio of boys to girls is 3:2 in a class of 40. How many boys are there?", "MCQ", ["16", "20", "24", "30"], "24"),
            ("The average of 10, 20, 30, and 40 is:", "MCQ", ["20", "25", "30", "35"], "25"),
            ("A product marked at ₹1,000 is sold at a 10% discount. What is the selling price?", "MCQ", ["₹800", "₹850", "₹900", "₹950"], "₹900"),
            ("If 5 notebooks cost ₹150, what is the cost of 8 notebooks at the same rate?", "MCQ", ["₹200", "₹220", "₹240", "₹250"], "₹240"),
            ("A value falls from 80 to 60. What is the percentage decrease?", "MCQ", ["20%", "25%", "30%", "40%"], "25%"),
            ("A table shows sales of 120 units in January and 150 in February. The increase is:", "MCQ", ["20 units", "25 units", "30 units", "35 units"], "30 units"),
            ("If 40% of a number is 72, the number is:", "MCQ", ["144", "160", "180", "200"], "180"),
            ("When interpreting a chart, checking its title, units, labels, and time period helps avoid misreading the data.", "TRUE_FALSE", None, "True"),
            ("A percentage change should always be calculated using the final value as the base.", "TRUE_FALSE", None, "False"),
        ],
    },
}


def main():
    db = SessionLocal()
    created_quizzes = 0
    created_questions = 0
    skipped_courses = []

    try:
        for course_id in range(18, 34):
            course = db.get(Course, course_id)

            if course is None:
                skipped_courses.append((course_id, "course not found"))
                continue

            if course.instructor_id != OWNER_ID:
                skipped_courses.append((course_id, "not owned by instructor 8"))
                continue

            if not course.is_published:
                skipped_courses.append((course_id, "course is not published"))
                continue

            existing_quiz = db.scalar(
                select(Quiz).where(Quiz.course_id == course_id).limit(1)
            )
            if existing_quiz is not None:
                skipped_courses.append((course_id, "already has a quiz"))
                continue

            content = QUIZ_CONTENT.get(course_id)
            if content is None or len(content["questions"]) != 10:
                raise ValueError(
                    f"Quiz content missing or invalid for course {course_id}"
                )

            quiz = Quiz(
                course_id=course_id,
                title=content["title"],
                description=content["description"],
                time_limit_minutes=15,
                passing_score=70,
                is_published=True,
            )
            db.add(quiz)
            db.flush()  # Get quiz.id before adding its questions.

            for order_index, item in enumerate(content["questions"], start=1):
                question_text, question_type, options, correct_answer = item

                if question_type == "MCQ":
                    if not options or len(options) < 2 or correct_answer not in options:
                        raise ValueError(
                            f"Invalid MCQ in course {course_id}, question {order_index}"
                        )
                elif question_type == "TRUE_FALSE":
                    if options is not None or correct_answer not in ("True", "False"):
                        raise ValueError(
                            f"Invalid true/false question in course {course_id}, question {order_index}"
                        )
                else:
                    raise ValueError(
                        f"Unsupported question type in course {course_id}, question {order_index}"
                    )

                db.add(
                    Question(
                        quiz_id=quiz.id,
                        question_text=question_text,
                        question_type=question_type,
                        options=options,
                        correct_answer=correct_answer,
                        points=1,
                        order_index=order_index,
                    )
                )
                created_questions += 1

            created_quizzes += 1
            print(f"Prepared: {course.title}")

        db.commit()

        print("\nQUIZ SEEDING COMPLETED")
        print("---------------------")
        print(f"Quizzes created: {created_quizzes}")
        print(f"Questions created: {created_questions}")
        print(f"Courses skipped: {len(skipped_courses)}")
        for course_id, reason in skipped_courses:
            print(f"  Course {course_id}: {reason}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
