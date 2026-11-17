
from urllib.parse import quote_plus

LINK_NOTE = "Link to the provider's own search results. Not course data stored by Statskill."

_PROVIDERS = [
    {"provider": "coursera", "name": "Coursera", "template": "https://www.coursera.org/search?query={q}", "is_free": None},
    {"provider": "udemy", "name": "Udemy", "template": "https://www.udemy.com/courses/search/?q={q}", "is_free": None},
    {"provider": "swayam", "name": "SWAYAM", "template": "https://swayam.gov.in/explorer?searchText={q}", "is_free": True},
    {"provider": "nptel", "name": "NPTEL", "template": "https://nptel.ac.in/courses", "is_free": True},
    {"provider": "edx", "name": "edX", "template": "https://www.edx.org/search?q={q}", "is_free": None},
    {"provider": "khan", "name": "Khan Academy", "template": "https://www.khanacademy.org/search?page_search_query={q}", "is_free": True},
]


def list_providers() -> list[dict]:
    return [{"provider": p["provider"], "name": p["name"]} for p in _PROVIDERS]


def build_link_results(query: str, only: list[str] | None = None) -> list[dict]:
    q = quote_plus((query or "").strip())
    wanted = {o.lower() for o in only} if only else None
    results = []
    for p in _PROVIDERS:
        if wanted and p["provider"] not in wanted:
            continue
        results.append(
            {
                "provider": p["provider"],
                "name": p["name"],
                "url": p["template"].format(q=q),
                "is_free": p["is_free"],
                "note": LINK_NOTE,
            }
        )
    return results
