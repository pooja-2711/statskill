
from pathlib import Path
import re

import chromadb
import pymupdf
from sentence_transformers import SentenceTransformer


# Project paths
BASE_DIR = Path(__file__).resolve().parent

PDF_PATH = (
    BASE_DIR
    / "data"
    / "envi_stats_source"
    / "EnviStats_India_2024_Environment_Statistics.pdf"
)

DB_PATH = BASE_DIR / "data" / "envi_stats_chroma_db"

COLLECTION_NAME = "official_statistics"
MODEL_NAME = "all-MiniLM-L6-v2"

CHUNK_SIZE = 1200
CHUNK_OVERLAP = 180
BATCH_SIZE = 100


def clean_text(text):
    """Clean extracted PDF text without removing paragraph structure."""
    lines = [line.strip() for line in text.splitlines()]
    text = "\n".join(line for line in lines if line)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def split_into_chunks(text):
    """Split text into overlapping passages."""
    chunks = []
    start = 0

    while start < len(text):
        end = min(start + CHUNK_SIZE, len(text))

        if end < len(text):
            boundary = text.rfind(" ", start, end)
            if boundary > start + CHUNK_SIZE // 2:
                end = boundary

        chunk = text[start:end].strip()

        if len(chunk) >= 100:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = max(end - CHUNK_OVERLAP, start + 1)

    return chunks


def main():
    if not PDF_PATH.exists():
        raise FileNotFoundError(f"Report not found: {PDF_PATH}")

    print("Opening official EnviStats report...")

    pdf = pymupdf.open(PDF_PATH)

    documents = []
    metadatas = []
    ids = []

    for page_index, page in enumerate(pdf):
        page_number = page_index + 1
        text = clean_text(page.get_text("text", sort=True))

        if len(text) < 100:
            continue

        chunks = split_into_chunks(text)

        for chunk_index, chunk in enumerate(chunks):
            documents.append(chunk)

            metadatas.append({
                "source": "EnviStats India 2024",
                "filename": PDF_PATH.name,
                "page": page_number,
                "chunk": chunk_index,
            })

            ids.append(f"envi_page_{page_number}_chunk_{chunk_index}")

    pdf.close()

    if not documents:
        raise RuntimeError("No readable passages were extracted.")

    print(f"Extracted passages: {len(documents)}")
    print("Loading embedding model...")

    model = SentenceTransformer(MODEL_NAME)

    print("Creating ChromaDB database...")

    DB_PATH.mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(path=str(DB_PATH))

    # Rebuild only this EnviStats collection.
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    print("Generating embeddings and storing passages...")

    for start in range(0, len(documents), BATCH_SIZE):
        end = min(start + BATCH_SIZE, len(documents))

        batch_documents = documents[start:end]

        embeddings = model.encode(
            batch_documents,
            normalize_embeddings=True,
            show_progress_bar=False,
        ).tolist()

        collection.add(
            ids=ids[start:end],
            documents=batch_documents,
            metadatas=metadatas[start:end],
            embeddings=embeddings,
        )

        print(f"Stored {end}/{len(documents)} passages")

    print("\nDATABASE BUILD SUCCESSFUL")
    print("Database:", DB_PATH)
    print("Collection:", COLLECTION_NAME)
    print("Total passages:", collection.count())
    print("Total PDF pages:", len(pymupdf.open(PDF_PATH)))


if __name__ == "__main__":
    main()
