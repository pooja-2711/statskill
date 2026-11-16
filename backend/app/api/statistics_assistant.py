
from pathlib import Path

import chromadb
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

from app.core.dependencies import get_current_user


router = APIRouter(
    prefix="/statistics-assistant",
    tags=["Statistics Assistant"],
)

# Use the current backend folder, not the teammate's computer.
BASE_DIR = Path(__file__).resolve().parents[2]

DATABASE_PATH = (
    BASE_DIR / "data" / "envi_stats_chroma_db"
)

COLLECTION_NAME = "official_statistics"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

_embedding_model = None
_collection = None


class StatisticsQuestion(BaseModel):
    question: str = Field(min_length=3, max_length=1000)
    limit: int = Field(default=5, ge=1, le=10)


def get_statistics_resources():
    global _embedding_model, _collection

    if not DATABASE_PATH.exists():
        raise HTTPException(
            status_code=503,
            detail="EnviStats database was not found.",
        )

    if _embedding_model is None:
        _embedding_model = SentenceTransformer(
            EMBEDDING_MODEL_NAME
        )

    if _collection is None:
        try:
            client = chromadb.PersistentClient(
                path=str(DATABASE_PATH)
            )

            _collection = client.get_collection(
                COLLECTION_NAME
            )

        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail="EnviStats collection is unavailable.",
            ) from exc

    return _embedding_model, _collection


@router.post("/search")
def search_statistics(
    request: StatisticsQuestion,
    current_user=Depends(get_current_user),
):
    try:
        model, collection = get_statistics_resources()

        question_embedding = model.encode(
            request.question,
            normalize_embeddings=True,
        ).tolist()

        results = collection.query(
            query_embeddings=[question_embedding],
            n_results=min(request.limit, collection.count()),
            include=[
                "documents",
                "distances",
                "metadatas",
            ],
        )

        documents = results.get("documents", [[]])[0]
        distances = results.get("distances", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]

        passages = []

        for index, document in enumerate(documents):
            metadata = (
                metadatas[index]
                if index < len(metadatas) and metadatas[index]
                else {}
            )

            passages.append({
                "content": document,
                "distance": (
                    distances[index]
                    if index < len(distances)
                    else None
                ),
                "page": metadata.get("page"),
                "source": metadata.get("source"),
                "filename": metadata.get("filename"),
            })

        return {
            "question": request.question,
            "results": passages,
            "count": len(passages),
        }

    except HTTPException:
        raise

    except Exception as exc:
        print(f"EnviStats search error: {exc}")
        raise HTTPException(
            status_code=500,
            detail="Could not search the statistics database.",
        ) from exc
