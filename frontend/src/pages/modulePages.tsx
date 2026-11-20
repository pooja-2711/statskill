
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Globe,
  Landmark,
  Newspaper,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import ModulePage, { type ModuleItem } from "../components/ModulePage";
import { apiFetch } from "../services/apiClient";

const schemeItems: ModuleItem[] = [
  {
    id: "pm-kisan",
    title: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    summary: "Income support scheme for eligible landholding farmer families across India.",
    category: "Agriculture",
    source: "Government of India",
    url: "https://pmkisan.gov.in/",
    tags: ["Central", "Farmers", "Agriculture", "Financial Support"],
    eligibility: [
      "The applicant must belong to an eligible landholding farmer family.",
      "Landholding details must satisfy the scheme guidelines.",
      "The applicant must meet the scheme's exclusion criteria.",
      "A valid bank account and required Aadhaar verification must be available.",
    ],
    documents: [
      "Aadhaar details",
      "Landholding and land-record details",
      "Bank account number and IFSC code",
      "Registered mobile number",
      "e-KYC verification details",
    ],
    applicationSteps: [
      "Open the official PM-KISAN website.",
      "Choose the registration option and follow the instructions for new farmer registration.",
      "Enter the required personal, landholding and bank details.",
      "Complete the required Aadhaar verification and e-KYC process.",
      "Submit the information and save the registration reference.",
      "Use the beneficiary status section to check application and payment details.",
    ],
    faqs: [
      {
        question: "Who can benefit from PM-KISAN?",
        answer: "Eligible landholding farmer families can receive assistance, subject to the scheme's exclusion criteria.",
      },
      {
        question: "How much financial assistance is provided?",
        answer: "Eligible families receive ₹6,000 per year in three equal instalments, subject to applicable rules.",
      },
      {
        question: "How can I register for PM-KISAN?",
        answer: "Use the official PM-KISAN portal or contact the appropriate local agriculture office for registration assistance.",
      },
      {
        question: "How can I check my payment status?",
        answer: "Visit the official PM-KISAN portal and use the beneficiary status service.",
      },
    ],
    body: `OVERVIEW
PM-KISAN is a Central Government scheme that provides income support to eligible landholding farmer families.

BENEFITS
Eligible families receive ₹6,000 per year in three equal instalments through Direct Benefit Transfer (DBT) to their bank accounts.

WHO CAN APPLY?
Landholding farmer families may qualify, subject to the scheme's exclusion rules. Certain higher-income groups and specified categories are excluded.

HOW TO APPLY OR CHECK STATUS
Visit the official PM-KISAN portal to register, complete e-KYC, check beneficiary status and view payment details.

IMPORTANT
Eligibility depends on land records and the official exclusion criteria. Check the latest instructions on the official portal.`,
  },
  {
    id: "mgnrega",
    title: "Mahatma Gandhi National Rural Employment Guarantee Scheme",
    summary: "Provides a legal guarantee of wage employment to eligible rural households.",
    category: "Employment",
    source: "Ministry of Rural Development, Government of India",
    url: "https://nrega.dord.gov.in/",
    tags: ["Central", "Rural", "Employment", "Wage Work"],
    eligibility: [
      "The applicant must be an adult member (18 years or older) of a rural household.",
      "The household must be willing to undertake unskilled manual work.",
      "The household must register with the relevant Gram Panchayat.",
      "Job card and work allocation are subject to the scheme rules.",
    ],
    documents: [
      "Household member details",
      "Age and identity proof, as requested",
      "Residence details",
      "Photographs, if required for the job card",
      "Bank or post office account details",
    ],
    applicationSteps: [
      "Visit your local Gram Panchayat.",
      "Request household registration under MGNREGA.",
      "Provide the required household, age and identity details.",
      "Complete the job card registration process.",
      "After registration, request employment through the Gram Panchayat.",
      "Keep your job card and work-related records safe.",
    ],
    faqs: [
      {
        question: "Who can apply for an MGNREGA job card?",
        answer: "Adult members aged 18 or above belonging to a rural household can request registration.",
      },
      {
        question: "How many days of employment are guaranteed?",
        answer: "The scheme provides up to 100 days of guaranteed wage employment per financial year to an eligible rural household, subject to the rules.",
      },
      {
        question: "Where can I apply for a job card?",
        answer: "You can apply through your local Gram Panchayat.",
      },
      {
        question: "How can I check MGNREGA work details?",
        answer: "Use the official MGNREGA portal to check job card, work and payment-related information.",
      },
    ],
    body: `OVERVIEW
MGNREGA aims to improve livelihood security in rural areas by providing guaranteed wage employment.

BENEFITS
The scheme provides up to 100 days of guaranteed wage employment in a financial year to a rural household whose adult members volunteer to do unskilled manual work.

WHO CAN APPLY?
Adult members of rural households who are willing to undertake unskilled manual work can seek registration.

HOW TO APPLY
Contact the Gram Panchayat to seek a job card and employment under the scheme. Use the official portal to access programme information.

IMPORTANT
Work allocation, wages and procedures are governed by the applicable scheme rules and state notifications.`,
  },
  {
    id: "nmmss",
    title: "National Means-cum-Merit Scholarship Scheme (NMMSS)",
    summary: "Scholarship support for meritorious students from economically weaker sections.",
    category: "Education",
    source: "Ministry of Education, Government of India",
    url: "https://www.education.gov.in/en/national-means-cum-merit-scholarship-scheme-nmmss",
    tags: ["Central", "Students", "Scholarship", "Education"],
    eligibility: [
      "The student must be studying in the eligible class and school category specified in the current notification.",
      "The student must meet the prescribed marks requirement in the previous examination.",
      "Family income must be within the current scheme limit.",
      "The student must qualify through the prescribed selection examination.",
      "Other school, continuation and renewal conditions must be satisfied.",
    ],
    documents: [
      "Student and school details",
      "Previous class marksheet",
      "Family income certificate",
      "Bank account details",
      "Caste or disability certificate, if applicable",
    ],
    applicationSteps: [
      "Check the latest NMMSS notification issued for your state.",
      "Confirm that your class, school and academic details meet the requirements.",
      "Contact your school for the application and selection examination procedure.",
      "Prepare the required marksheet, income certificate and other documents.",
      "Complete the application through the prescribed process.",
      "Check the examination result and scholarship instructions in the official notification.",
    ],
    faqs: [
      {
        question: "Who is eligible for NMMSS?",
        answer: "Students who meet the prescribed school, academic performance and family income conditions may qualify.",
      },
      {
        question: "How are students selected?",
        answer: "Selection is generally based on the prescribed state-level selection examination and applicable eligibility rules.",
      },
      {
        question: "Where can students apply?",
        answer: "Students should follow the current application instructions issued by their state and the official scholarship authorities.",
      },
      {
        question: "Can the scholarship be renewed?",
        answer: "Renewal may be available if the student satisfies the prescribed academic and continuation conditions.",
      },
    ],
    body: `OVERVIEW
NMMSS is designed to reduce the dropout rate after Class VIII and encourage students to continue their education at the secondary stage.

BENEFITS
Selected students receive scholarship assistance subject to the scheme's rules and renewal conditions.

WHO CAN APPLY?
Students studying in eligible schools may apply if they satisfy the prescribed academic performance and parental-income conditions.

HOW TO APPLY
Selection is conducted through the prescribed process, including a state-level selection examination. Check the Ministry of Education website and current notifications for application details.

IMPORTANT
Eligibility, examination dates and scholarship conditions must be checked in the latest official notification.`,
  },
  {
    id: "pmjay",
    title: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana",
    summary: "Government-funded health coverage for eligible beneficiaries.",
    category: "Health",
    source: "National Health Authority, Government of India",
    url: "https://pmjay.gov.in/",
    tags: ["Central", "Health", "Healthcare", "Hospital"],
    eligibility: [
      "The family or individual must be identified as eligible under the applicable beneficiary database.",
      "Eligibility depends on the applicable government identification criteria.",
      "The beneficiary must complete verification through an authorised process.",
      "Possession of an Aadhaar card alone does not guarantee eligibility.",
    ],
    documents: [
      "Identity proof accepted during beneficiary verification",
      "Ration card or family ID, where applicable",
      "Mobile number",
      "Beneficiary or eligibility record details",
    ],
    applicationSteps: [
      "Open the official PM-JAY website.",
      "Use the beneficiary eligibility service to check whether your family is covered.",
      "Follow the authorised beneficiary verification process.",
      "Visit an authorised Ayushman Mitra desk if assistance is required.",
      "Complete the required identity and beneficiary verification.",
      "Check the list of empanelled hospitals before seeking treatment.",
    ],
    faqs: [
      {
        question: "Who can receive PM-JAY benefits?",
        answer: "Families identified as eligible under the applicable government beneficiary criteria can receive benefits.",
      },
      {
        question: "Is hospital treatment cashless?",
        answer: "Eligible beneficiaries can receive covered hospital treatment without paying at the point of service at empanelled hospitals, subject to scheme rules.",
      },
      {
        question: "How can I check my eligibility?",
        answer: "Use the beneficiary eligibility service on the official PM-JAY website or seek help from an authorised Ayushman Mitra desk.",
      },
      {
        question: "Can I use the scheme at any hospital?",
        answer: "Benefits are available at participating empanelled hospitals for covered treatments, not automatically at every hospital.",
      },
    ],
    body: `OVERVIEW
Pradhan Mantri Jan Arogya Yojana (PM-JAY) is a major health assurance initiative for eligible families.

BENEFITS
The scheme provides cashless hospitalisation coverage at empanelled hospitals, subject to the applicable package and eligibility rules.

WHO CAN APPLY?
Eligibility is based on the beneficiary criteria notified by the government. Not every household is automatically covered.

HOW TO CHECK
Visit the official PM-JAY portal to learn about eligibility, beneficiary identification and empanelled hospitals.

IMPORTANT
Confirm your eligibility and the services covered before seeking treatment.`,
  },
  {
    id: "pmay-g",
    title: "Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)",
    summary: "Supports eligible rural households in obtaining a permanent house.",
    category: "Central",
    source: "Ministry of Rural Development, Government of India",
    url: "https://pmayg.nic.in/",
    tags: ["Central", "Housing", "Rural", "Financial Assistance"],
    eligibility: [
      "The household must meet the rural housing eligibility criteria.",
      "The household must satisfy the applicable deprivation and exclusion conditions.",
      "The beneficiary must be identified through the prescribed government selection process.",
      "Existing housing status and household details are considered under scheme rules.",
    ],
    documents: [
      "Identity proof",
      "Household and housing details",
      "Bank account details",
      "Land or site details, where required",
      "Beneficiary verification details",
    ],
    applicationSteps: [
      "Contact your Gram Panchayat or local rural development office.",
      "Ask about the current PMAY-G beneficiary identification process.",
      "Provide the required household and housing information.",
      "Complete the prescribed verification process.",
      "Check the official beneficiary list or application status.",
      "Follow the instructions given by the authorised department if selected.",
    ],
    faqs: [
      {
        question: "Who can benefit from PMAY-G?",
        answer: "Eligible rural houseless households and households living in inadequate housing may be considered under the prescribed selection process.",
      },
      {
        question: "How are beneficiaries selected?",
        answer: "Beneficiaries are identified and verified through the applicable government criteria and procedures.",
      },
      {
        question: "Where can I check my beneficiary status?",
        answer: "Check the official PMAY-G portal or contact your Gram Panchayat or rural development office.",
      },
      {
        question: "Does everyone who applies receive housing assistance?",
        answer: "No. Assistance depends on eligibility, beneficiary selection, verification and available government provisions.",
      },
    ],
    body: `OVERVIEW
PMAY-G is a rural housing programme intended to help eligible houseless households and households living in inadequate houses obtain a pucca house.

BENEFITS
Eligible beneficiaries receive housing assistance according to the applicable government norms and location-specific provisions.

WHO CAN APPLY?
Selection is based on the prescribed eligibility and verification process. Inclusion is not automatic.

HOW TO CHECK
Visit the official PMAY-G portal or contact the Gram Panchayat and relevant rural development office.

IMPORTANT
Beneficiary lists, assistance amounts and construction conditions are subject to current government guidelines.`,
  },
  {
    id: "pmuy",
    title: "Pradhan Mantri Ujjwala Yojana (PMUY)",
    summary: "Promotes access to clean cooking fuel for eligible households.",
    category: "Central",
    source: "Ministry of Petroleum and Natural Gas, Government of India",
    url: "https://www.pmuy.gov.in/",
    tags: ["Central", "LPG", "Women", "Clean Energy"],
    eligibility: [
      "The applicant must be an adult woman.",
      "The household must meet the scheme's deprivation or eligibility conditions.",
      "The household must not already have an LPG connection under the applicable exclusion rules.",
      "The applicant must provide the required identity and household information.",
    ],
    documents: [
      "Aadhaar details of the applicant",
      "Family composition or ration card details",
      "Bank account details",
      "Address proof, where applicable",
      "Required application forms and declarations",
    ],
    applicationSteps: [
      "Open the official PMUY website and review the latest eligibility rules.",
      "Contact an authorised LPG distributor or use the official application process.",
      "Obtain the applicable application form.",
      "Provide the required Aadhaar, household and bank details.",
      "Submit the completed application and supporting documents.",
      "Follow the distributor's instructions for verification and connection status.",
    ],
    faqs: [
      {
        question: "Who can apply for PMUY?",
        answer: "Eligible adult women from households meeting the prescribed scheme conditions may apply.",
      },
      {
        question: "Where can I apply for an LPG connection?",
        answer: "You can approach an authorised LPG distributor or follow the application instructions on the official PMUY website.",
      },
      {
        question: "Which documents are generally required?",
        answer: "Aadhaar details, household information, bank details and other documents required by the current application process may be needed.",
      },
      {
        question: "How can I check my application status?",
        answer: "Contact your LPG distributor or use the official services provided by the relevant LPG provider.",
      },
    ],
    body: `OVERVIEW
PMUY aims to make clean cooking fuel available to eligible households by supporting access to LPG connections.

BENEFITS
Eligible applicants may receive an LPG connection under the scheme's applicable assistance provisions.

WHO CAN APPLY?
Applications are intended for eligible adult women from households meeting the prescribed deprivation and exclusion criteria.

HOW TO APPLY
Visit the official PMUY portal or approach an authorised LPG distributor for application guidance.

IMPORTANT
Required documents, eligibility conditions and current benefits should be confirmed through the official portal or LPG distributor.`,
  },
  {
    id: "gruha-lakshmi",
    title: "Karnataka Gruha Lakshmi Scheme",
    summary: "Financial assistance programme for eligible women who are heads of households in Karnataka.",
    category: "State",
    source: "Government of Karnataka",
    url: "https://sevasindhu.karnataka.gov.in/",
    tags: ["State", "Karnataka", "Women", "Financial Assistance"],
    eligibility: [
      "The applicant must satisfy the current Karnataka Government eligibility conditions.",
      "The applicant must be the eligible woman identified under the applicable ration-card rules.",
      "The ration-card and household details must meet the current scheme requirements.",
      "Income-tax and GST-related exclusions may apply under the notified rules.",
    ],
    documents: [
      "Karnataka ration card details",
      "Applicant's Aadhaar details",
      "Bank account details",
      "Registered mobile number",
      "Aadhaar-linked bank details for DBT",
    ],
    applicationSteps: [
      "Check the latest Gruha Lakshmi eligibility instructions issued by Karnataka Government.",
      "Keep your Karnataka ration card and applicant details ready.",
      "Visit the official Seva Sindhu portal or an authorised service centre.",
      "Follow the currently available registration or application instructions.",
      "Complete the required identity and bank account verification.",
      "Use the authorised government service to check application or payment status.",
    ],
    faqs: [
      {
        question: "Who can receive Gruha Lakshmi benefits?",
        answer: "Eligible women identified as household heads under Karnataka's current scheme rules may receive assistance.",
      },
      {
        question: "How can I apply for Gruha Lakshmi?",
        answer: "Follow the current application instructions through Seva Sindhu or an authorised Karnataka service centre.",
      },
      {
        question: "Is a ration card required?",
        answer: "Ration-card and household details are important for determining eligibility under the applicable scheme rules.",
      },
      {
        question: "How can I check payment status?",
        answer: "Use the available official Karnataka Government services or contact an authorised service centre.",
      },
    ],
    body: `OVERVIEW
Gruha Lakshmi is one of Karnataka's state welfare guarantee programmes. It is intended to provide financial assistance to eligible women who are recognised as heads of their households.

BENEFITS
Eligible beneficiaries receive financial assistance under the scheme, subject to the current government guidelines.

WHO CAN APPLY?
The scheme is intended for eligible women household heads in Karnataka. Ration-card details and other prescribed conditions may apply.

HOW TO APPLY OR CHECK STATUS
Visit the Karnataka Seva Sindhu portal or contact the relevant state department or authorised service centre.

IMPORTANT
Confirm the latest eligibility rules, application status and payment information through official Karnataka Government channels.`,
  },
  {
    id: "yuva-nidhi",
    title: "Karnataka Yuva Nidhi Scheme",
    summary: "Unemployment assistance programme for eligible graduates and diploma holders in Karnataka.",
    category: "Employment",
    source: "Government of Karnataka",
    url: "https://sevasindhu.karnataka.gov.in/",
    tags: ["State", "Karnataka", "Youth", "Graduates", "Employment"],
    eligibility: [
      "The applicant must hold an eligible graduation or diploma qualification.",
      "The applicant must satisfy the prescribed Karnataka residence conditions.",
      "The applicant must meet the applicable unemployment and waiting-period conditions.",
      "The applicant must not fall under the employment or other exclusion categories in the current notification.",
    ],
    documents: [
      "Aadhaar details",
      "Karnataka residence details",
      "Graduation or diploma certificate",
      "Bank account details",
      "Unemployment declaration, as required",
      "Registered mobile number",
    ],
    applicationSteps: [
      "Check the latest Yuva Nidhi notification and eligibility conditions.",
      "Keep your graduation or diploma certificate and Karnataka residence details ready.",
      "Open the Karnataka Seva Sindhu portal.",
      "Find the Yuva Nidhi application service, if currently available.",
      "Enter the requested details and complete the required declarations.",
      "Submit the application and save its reference number.",
      "Check the application status through the official service.",
    ],
    faqs: [
      {
        question: "Who can apply for Yuva Nidhi?",
        answer: "Eligible unemployed graduates and diploma holders who satisfy the current Karnataka Government conditions may apply.",
      },
      {
        question: "Is the scheme available to all graduates?",
        answer: "No. Applicants must satisfy the prescribed qualification, residence, unemployment and other eligibility conditions.",
      },
      {
        question: "Where can I submit an application?",
        answer: "Check the Karnataka Seva Sindhu portal for the current Yuva Nidhi application service and instructions.",
      },
      {
        question: "How can I check my application status?",
        answer: "Use the official application-status service and your saved application reference number, where available.",
      },
    ],
    body: `OVERVIEW
Yuva Nidhi is a Karnataka Government programme intended to support eligible unemployed graduates and diploma holders.

BENEFITS
The scheme provides financial assistance to eligible applicants according to their educational qualification and the applicable government rules.

WHO CAN APPLY?
Eligible graduates and diploma holders who meet the prescribed unemployment, residence and other conditions may apply.

HOW TO APPLY
Use the Karnataka Seva Sindhu portal to find application services and current instructions.

IMPORTANT
The waiting period, qualifying courses, required documents and other conditions must be checked in the latest official notification.`,
  },
  {
    id: "shakti",
    title: "Karnataka Shakti Scheme",
    summary: "Provides eligible women with free travel on specified Karnataka state-run bus services.",
    category: "State",
    source: "Government of Karnataka",
    url: "https://sevasindhu.karnataka.gov.in/",
    tags: ["State", "Karnataka", "Women", "Transport", "Bus Travel"],
    eligibility: [
      "The beneficiary must be an eligible woman resident of Karnataka under the scheme rules.",
      "Eligible transgender persons are also covered under the applicable guidelines.",
      "Travel must be on covered Karnataka state-run bus services.",
      "The scheme does not apply to every private bus or excluded service.",
    ],
    documents: [
      "Eligible government-approved photo ID",
      "Identity and Karnataka residence details, where requested",
      "Relevant bus travel or zero-fare ticket details",
    ],
    applicationSteps: [
      "Check the latest Shakti Scheme travel guidelines.",
      "Carry an identity document accepted under the scheme.",
      "Use an eligible Karnataka state-run bus service covered by the scheme.",
      "Follow the conductor's instructions for issuing a zero-fare ticket.",
      "Keep the ticket or travel record until your journey is complete.",
      "Check official transport department instructions for excluded services.",
    ],
    faqs: [
      {
        question: "Who can use the Shakti Scheme?",
        answer: "Eligible women residents of Karnataka and other covered beneficiaries under the applicable guidelines can use the scheme.",
      },
      {
        question: "Is bus travel completely free?",
        answer: "Eligible beneficiaries can travel without paying the applicable fare on covered Karnataka state-run bus services.",
      },
      {
        question: "Which buses are covered?",
        answer: "The scheme applies to specified state-run bus services. Private buses and excluded services are not automatically covered.",
      },
      {
        question: "Do I need identification while travelling?",
        answer: "Yes. Carry an identity document accepted under the latest Shakti Scheme guidelines.",
      },
    ],
    body: `OVERVIEW
The Shakti Scheme is a Karnataka Government initiative intended to make public bus transport more accessible to eligible women.

BENEFITS
Eligible women can travel without paying the applicable fare on covered state-run bus services, subject to scheme conditions.

WHO CAN USE IT?
The scheme covers eligible women residents of Karnataka. The applicable rules also specify the categories of services and travel covered.

HOW TO USE
Check the latest instructions through Karnataka Government transport services and carry the required identification or travel documentation.

IMPORTANT
The scheme does not necessarily cover every bus operator, route or service. Confirm the covered services before travelling.`,
  },
  {
    id: "anna-bhagya",
    title: "Karnataka Anna Bhagya Scheme",
    summary: "Food security support for eligible ration-card households in Karnataka.",
    category: "State",
    source: "Government of Karnataka - Food and Civil Supplies Department",
    url: "https://ahara.karnataka.gov.in/",
    tags: ["State", "Karnataka", "Food Security", "Ration", "Welfare"],
    eligibility: [
      "The household must hold an eligible Karnataka ration card.",
      "The household must satisfy the current food-security and beneficiary conditions.",
      "The benefit depends on the eligible household members and applicable quantity rules.",
      "Any cash-transfer component is subject to the current government conditions.",
    ],
    documents: [
      "Eligible Karnataka ration card",
      "Aadhaar details of family members",
      "Bank account details, if applicable to the benefit",
      "Registered mobile number",
    ],
    applicationSteps: [
      "Check whether your household has an eligible Karnataka ration card.",
      "Visit the Karnataka Food and Civil Supplies Department website.",
      "Check the latest beneficiary and ration distribution information.",
      "Keep your ration card and family member details ready.",
      "Visit the authorised ration distribution centre when required.",
      "Follow official instructions for any applicable benefit or payment status.",
    ],
    faqs: [
      {
        question: "Who can receive Anna Bhagya benefits?",
        answer: "Eligible Karnataka ration-card households can receive benefits subject to the current scheme conditions.",
      },
      {
        question: "What benefits does Anna Bhagya provide?",
        answer: "The scheme provides food-grain support or other assistance according to current Karnataka Government provisions.",
      },
      {
        question: "Where can I check ration-card details?",
        answer: "Visit the Karnataka Food and Civil Supplies Department's official Ahara portal.",
      },
      {
        question: "Are benefits the same for every household?",
        answer: "No. Benefits may depend on eligible family members, ration-card category and current government rules.",
      },
    ],
    body: `OVERVIEW
Anna Bhagya is a Karnataka Government food security programme for eligible ration-card households.

BENEFITS
The programme provides food-grain support or other assistance as specified by the current state government rules.

WHO CAN APPLY?
Eligible households holding the relevant ration cards may receive benefits, subject to the applicable conditions.

HOW TO CHECK
Visit the Karnataka Food and Civil Supplies Department portal to check ration-card services, beneficiary information and current scheme instructions.

IMPORTANT
The quantity and form of assistance can depend on current government decisions and eligibility. Check the official portal for the latest details.`,
  },
];

const examItems: ModuleItem[] = [];

const CONTENT_CATEGORIES = [
  "Polity",
  "Economy",
  "International Relations",
  "Environment",
  "Science & Technology",
  "Defence",
  "Social Issues",
  "Sports",
  "Government Schemes",
  "Miscellaneous",
];

interface ContentItem {
  id: string;
  source_name: string;
  source_key: string | null;
  title: string;
  category: string;
  published_at: string | null;
  summary: string | null;
  url: string;
  label: string;
  section: string;
  fetched_at: string;
}

interface ContentListResponse {
  items: ContentItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
}

interface ContentSource {
  key: string;
  name: string;
  kind: string;
  homepage_url: string | null;
  item_count: number;
  last_fetched_at: string | null;
  last_status: string | null;
}

interface ContentSourcesResponse {
  sources: ContentSource[];
  categories: string[];
}

interface ContentPageProps {
  title: string;
  description: string;
  endpoint: "/current-affairs" | "/newspapers";
  icon: typeof Globe;
  showSourceFilter?: boolean;
}

function formatDate(value: string | null): string {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ContentPage({
  title,
  description,
  endpoint,
  icon: Icon,
  showSourceFilter = false,
}: ContentPageProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [categories, setCategories] = useState<string[]>(CONTENT_CATEGORIES);

  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSources() {
      try {
        const result = await apiFetch<ContentSourcesResponse>(
          "/content/sources"
        );

        if (cancelled) return;

        setCategories(
          result.categories?.length
            ? result.categories
            : CONTENT_CATEGORIES
        );

        setSources(
          (result.sources ?? []).filter(
            (item) => item.kind === "newspaper"
          )
        );
      } catch {
        // The article list can still load if source metadata fails.
      }
    }

    void loadSources();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadArticles() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        page_size: "20",
      });

      if (category) params.set("category", category);
      if (source && showSourceFilter) params.set("source", source);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      try {
        const result = await apiFetch<ContentListResponse>(
          `${endpoint}?${params.toString()}`
        );

        if (cancelled) return;

        setItems(result.items ?? []);
        setTotal(result.total ?? 0);
        setTotalPages(result.total_pages ?? 0);
      } catch (err) {
        if (cancelled) return;

        setItems([]);
        setTotal(0);
        setTotalPages(0);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load articles. Please try again."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadArticles();

    return () => {
      cancelled = true;
    };
  }, [endpoint, page, category, source, dateFrom, dateTo, showSourceFilter]);

  function clearFilters() {
    setCategory("");
    setSource("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <div className="tl-page">
      <section className="tl-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <Icon size={28} className="tl-gold" />
          <h1 className="tl-h1">{title}</h1>
        </div>

        <p className="tl-sub">{description}</p>

        <p className="tl-note" style={{ marginTop: 12 }}>
          {total.toLocaleString("en-IN")} articles available
        </p>
      </section>

      <section className="tl-card">
        <h2 className="tl-h2">Filter articles</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 14,
          }}
        >
          <label>
            <span className="tl-label">Category</span>
            <select
              className="tl-select"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {showSourceFilter && (
            <label>
              <span className="tl-label">Newspaper</span>
              <select
                className="tl-select"
                value={source}
                onChange={(event) => {
                  setSource(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All newspapers</option>
                {sources.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            <span className="tl-label">From date</span>
            <input
              className="tl-field"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <label>
            <span className="tl-label">To date</span>
            <input
              className="tl-field"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>

        <button
          type="button"
          className="tl-btn ghost"
          onClick={clearFilters}
          style={{ marginTop: 14 }}
        >
          Clear filters
        </button>
      </section>

      {error && (
        <div className="tl-error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => setPage((current) => current)}
            style={{
              marginLeft: 12,
              border: 0,
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <section className="tl-card" style={{ textAlign: "center" }}>
          <RefreshCw
            size={22}
            className="tl-gold"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p className="tl-sub">Loading articles...</p>
        </section>
      ) : (
        <>
          {items.length === 0 && !error ? (
            <section className="tl-card">
              <h2 className="tl-h2">No articles found</h2>
              <p className="tl-sub">
                There are no articles matching these filters.
              </p>
            </section>
          ) : (
            <div className="tl-stack">
              {items.map((item) => (
                <article className="tl-card" key={item.id}>
                  <p
                    className="tl-gold"
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      margin: "0 0 8px",
                    }}
                  >
                    {item.source_name}
                  </p>

                  <h2
                    style={{
                      fontSize: 18,
                      lineHeight: 1.45,
                      margin: "0 0 12px",
                    }}
                  >
                    {item.title}
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      color: "var(--muted)",
                      fontSize: 12.5,
                      marginBottom: 12,
                    }}
                  >
                    <span>{item.category}</span>
                    <span>{formatDate(item.published_at)}</span>
                  </div>

                  {item.summary && (
                    <p
                      style={{
                        color: "var(--text)",
                        fontSize: 14,
                        lineHeight: 1.7,
                        margin: "0 0 16px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {item.summary}
                    </p>
                  )}

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tl-btn"
                    style={{
                      textDecoration: "none",
                      width: "fit-content",
                    }}
                  >
                    Read original article
                    <ExternalLink size={15} />
                  </a>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <section
              className="tl-card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="tl-btn ghost"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="tl-note">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                className="tl-btn ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export const CurrentAffairsPage = () => (
  <ContentPage
    title="Current Affairs"
    description="Daily current affairs summaries, categorized for exam preparation."
    endpoint="/current-affairs"
    icon={Globe}
  />
);

export const NewspapersPage = () => (
  <ContentPage
    title="Newspapers"
    description="Read recent articles from The Hindu, Indian Express, Times of India and Hindustan Times."
    endpoint="/newspapers"
    icon={Newspaper}
    showSourceFilter
  />
);

export const SchemesPage = () => (
  <ModulePage
    title="Government Schemes"
    description="Central and state schemes with official links."
    icon={Landmark}
    basePath="/schemes"
    items={schemeItems}
    categories={["Central", "State", "Agriculture", "Health", "Education", "Employment"]}
    searchPlaceholder="Search schemes…"
    emptyTitle="No schemes yet"
    emptyDescription="Schemes with official source links will appear here once a dataset is connected."
  />
);

export const ExamsPage = () => (
  <ModulePage
    title="Government Exams"
    description="Exam syllabus, pattern and official notification dates."
    icon={GraduationCap}
    basePath="/exams"
    items={examItems}
    categories={["UPSC", "SSC", "Banking", "Railways", "State PSC", "Defence"]}
    searchPlaceholder="Search exams…"
    emptyTitle="No exams yet"
    emptyDescription="Exam details will appear here once an exams dataset is connected."
  />
);
