import re

from app.models.content import CATEGORIES

_KEYWORDS: dict[str, list[str]] = {
    "Polity": [
        "parliament", "lok sabha", "rajya sabha", "supreme court", "high court", "court", "election",
        "elections", "election commission", "bjp", "congress", "aap", "tmc", "chief minister", "governor",
        "lieutenant governor", "constitution", "constitutional", "bill", "ordinance", "cabinet",
        "assembly", "opposition", "speaker", "verdict", "tribunal", "judiciary", "bypoll",
        "delimitation", "ruling party", "mla", "mp",
    ],
    "Economy": [
        "economy", "economic", "gdp", "inflation", "rbi", "reserve bank", "repo rate", "sensex", "nifty",
        "stock market", "shares", "gst", "tax", "budget", "fiscal", "trade", "exports", "imports",
        "tariff", "tariffs", "rupee", "bank", "banks", "banking", "loan", "investment", "investors",
        "ipo", "startup", "startups", "msme", "sebi", "fdi", "industry", "finance", "market", "markets",
        "crude oil",
    ],
    "International Relations": [
        "bilateral", "summit", "united nations", "g20", "g7", "brics", "quad", "asean", "nato", "sco",
        "foreign minister", "external affairs", "mea", "embassy", "ambassador", "diplomatic", "diplomat",
        "sanctions", "treaty", "foreign secretary", "geopolitical", "ceasefire", "gaza", "ukraine",
        "russia", "china", "pakistan", "israel", "iran",
    ],
    "Environment": [
        "climate", "pollution", "emissions", "emission", "carbon", "forest", "forests", "wildlife",
        "tiger", "tigers", "elephant", "elephants", "biodiversity", "aqi", "air quality", "renewable",
        "wetland", "cyclone", "flood", "floods", "drought", "monsoon", "heatwave", "glacier",
        "conservation", "environment", "environmental", "plastic", "ozone", "green hydrogen",
    ],
    "Science & Technology": [
        "isro", "nasa", "satellite", "rocket", "space", "scientists", "scientist", "research",
        "researchers", "ai", "artificial intelligence", "machine learning", "chatgpt", "quantum",
        "semiconductor", "chip", "chips", "software", "smartphone", "cyber", "cybersecurity", "hacking",
        "data breach", "5g", "robot", "robotics", "telescope", "genome", "technology", "tech",
    ],
    "Defence": [
        "army", "navy", "air force", "iaf", "military", "missile", "missiles", "defence", "drdo",
        "soldier", "soldiers", "troops", "border", "line of control", "bsf", "crpf", "fighter jet",
        "warship", "submarine", "terrorist", "terror attack", "encounter", "operation sindoor", "drone",
        "drones",
    ],
    "Social Issues": [
        "women", "children", "education", "school", "schools", "students", "student", "university",
        "health", "hospital", "disease", "poverty", "hunger", "caste", "dalit", "tribal", "minority",
        "protest", "protests", "gender", "unemployment", "migrant", "migrants", "labour", "healthcare",
        "nutrition", "vaccination", "disability", "elderly", "domestic violence", "child labour",
        "literacy", "neet", "jobs",
    ],
    "Government Schemes": [
        "scheme", "schemes", "yojana", "mission", "subsidy", "welfare", "pension", "ayushman",
        "jan dhan", "pm kisan", "mgnrega", "beneficiaries", "beneficiary", "anganwadi", "ration",
        "pradhan mantri", "digital india", "swachh bharat", "make in india", "skill india", "ujjwala",
        "awas", "kisan", "msp", "minimum support price", "cash transfer",
    ],
    "Sports": [
        "cricket", "ipl", "bcci", "football", "fifa", "olympic", "olympics", "paralympic", "tennis",
        "wimbledon", "hockey", "badminton", "kabaddi", "athlete", "athletes", "tournament", "medal",
        "t20", "odi", "test match", "world cup", "champions trophy", "grand slam", "formula 1", "f1",
        "chess", "wrestling", "boxing", "batter", "bowler", "wicket", "wickets", "innings", "match",
        "league", "coach", "player", "players",
    ],
}

# A tie goes to the category listed first here
_PRIORITY = [
    "Defence", "Sports", "Science & Technology", "Environment", "Government Schemes",
    "International Relations", "Economy", "Polity", "Social Issues",
]

_PATTERNS = {
    cat: re.compile(r"\b(?:" + "|".join(re.escape(k) for k in kws) + r")\b")
    for cat, kws in _KEYWORDS.items()
}

TITLE_WEIGHT = 2
SNIPPET_WEIGHT = 1
HINT_WEIGHT = 2
MIN_SCORE = 2

_HINTS = [
    (re.compile(r"sport"), "Sports"),
    (re.compile(r"business"), "Economy"),
    (re.compile(r"sci-tech|technology"), "Science & Technology"),
    (re.compile(r"international|world"), "International Relations"),
]


def _feed_hint(feed_url: str | None) -> str | None:
    url = (feed_url or "").lower()
    for pattern, category in _HINTS:
        if pattern.search(url):
            return category
    return None


def classify(title: str, snippet: str | None = None, feed_url: str | None = None) -> str:
    """Keyword-rule category for an item. Always returns one of the 10 categories."""
    title_l = (title or "").lower()
    snippet_l = (snippet or "").lower()

    scores: dict[str, int] = {}
    for cat, pattern in _PATTERNS.items():
        hits_title = len(set(pattern.findall(title_l)))
        hits_snippet = len(set(pattern.findall(snippet_l)))
        scores[cat] = hits_title * TITLE_WEIGHT + hits_snippet * SNIPPET_WEIGHT

    hint = _feed_hint(feed_url)
    if hint:
        scores[hint] = scores.get(hint, 0) + HINT_WEIGHT

    best = max(scores, key=lambda c: (scores[c], -_PRIORITY.index(c)))
    if scores[best] < MIN_SCORE:
        return "Miscellaneous"
    assert best in CATEGORIES
    return best