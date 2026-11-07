from app.db.base import Base
from app.db.session import engine
from app.models import User, Course


def create_tables():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


if __name__ == "__main__":
    create_tables()
