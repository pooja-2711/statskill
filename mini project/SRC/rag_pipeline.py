from pathlib import Path
from sentence_transformers import SentenceTransformer
import chromadb

# Locate project folders
project_folder = Path(__file__).resolve().parent.parent
processed_folder = project_folder / "DATA" / "PROCESSED"

# Read the chunks
chunks_file = processed_folder / "chunks.txt"

if not chunks_file.exists():
    print("ERROR: chunks.txt not found!")

else:
    text = chunks_file.read_text(encoding="utf-8")
    chunks = text.split("\n\n--- CHUNK SEPARATOR ---\n\n")

    chunks = [chunk.strip() for chunk in chunks if chunk.strip()]

    print("Total chunks loaded:", len(chunks))

    # Load the embedding model
    print("Loading AI embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    # Convert chunks into embeddings
    print("Creating embeddings...")
    embeddings = model.encode(chunks).tolist()

    # Create ChromaDB database
    database_path = project_folder / "DATA" / "PROCESSED" / "chroma_db"

    client = chromadb.PersistentClient(path=str(database_path))

    collection = client.get_or_create_collection(
        name="official_statistics"
    )

    # Store chunks and embeddings
    collection.upsert(
        ids=[str(i) for i in range(len(chunks))],
        documents=chunks,
        embeddings=embeddings
    )

    print("Embeddings created successfully!")
    print("Data stored in ChromaDB!")
    print("Total stored chunks:", collection.count())