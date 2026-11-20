from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.content import ContentSource

SOURCES = [
    {
        "key": "the-hindu", "name": "THE HINDU", "kind": "newspaper",
        "homepage_url": "https://www.thehindu.com",
        "feed_urls": [
            "https://www.thehindu.com/news/national/feeder/default.rss",
            "https://www.thehindu.com/news/international/feeder/default.rss",
            "https://www.thehindu.com/business/feeder/default.rss",
            "https://www.thehindu.com/sci-tech/feeder/default.rss",
            "https://www.thehindu.com/sport/feeder/default.rss",
        ],
    },
    {
        "key": "indian-express", "name": "THE INDIAN EXPRESS", "kind": "newspaper",
        "homepage_url": "https://indianexpress.com",
        "feed_urls": [
            "https://indianexpress.com/section/india/feed/",
            "https://indianexpress.com/section/world/feed/",
            "https://indianexpress.com/section/business/feed/",
            "https://indianexpress.com/section/technology/feed/",
            "https://indianexpress.com/section/sports/feed/",
        ],
    },
    {
        "key": "times-of-india", "name": "THE TIMES OF INDIA", "kind": "newspaper",
        "homepage_url": "https://timesofindia.indiatimes.com",
        "feed_urls": [
            "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
            "https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms",
            "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms",
            "https://timesofindia.indiatimes.com/rssfeeds/1898055.cms",
            "https://timesofindia.indiatimes.com/rssfeeds/4719148.cms",
        ],
    },
    {
        "key": "hindustan-times", "name": "HINDUSTAN TIMES", "kind": "newspaper",
        "homepage_url": "https://www.hindustantimes.com",
        "feed_urls": [
            "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml",
            "https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml",
            "https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml",
            "https://www.hindustantimes.com/feeds/rss/sports/rssfeed.xml",
        ],
    },
    {
        "key": "pib", "name": "PRESS INFORMATION BUREAU (PIB)", "kind": "official",
        "homepage_url": "https://pib.gov.in",
        "feed_urls": ["https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3"],
    },
    {
        "key": "mea", "name": "MINISTRY OF EXTERNAL AFFAIRS (MEA)", "kind": "official",
        "homepage_url": "https://www.mea.gov.in",
        "feed_urls": [],  # no confirmed RSS yet, resolved in step 4C
    },
    {
        "key": "gemini-grounded", "name": "AI-SUMMARISED CURRENT AFFAIRS", "kind": "ai",
        "homepage_url": None,
        "feed_urls": [],
    },
]


def main() -> None:
    db = SessionLocal()
    try:
        for data in SOURCES:
            src = db.scalar(select(ContentSource).where(ContentSource.key == data["key"]))
            if src is None:
                db.add(ContentSource(**data, is_active=True))
                print("created:", data["key"])
            else:
                src.name = data["name"]
                src.kind = data["kind"]
                src.homepage_url = data["homepage_url"]
                src.feed_urls = data["feed_urls"]
                print("updated:", data["key"])
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
