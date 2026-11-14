from pathlib import Path
from sentence_transformers import SentenceTransformer
import chromadb

# Find the project folder
project_folder = Path(__file__).resolve().parent.parent

# Find the ChromaDB database
database_path = project_folder / "DATA" / "PROCESSED" / "chroma_db"

# Connect to ChromaDB
client = chromadb.PersistentClient(path=str(database_path))

# Access the existing collection
collection = client.get_collection(
    name="official_statistics"
)

# Load the embedding model
print("Loading AI model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

# Ask the user a question
question = input("\nAsk a question about Indian environmental statistics: ")

# Convert question into an embedding
question_embedding = model.encode(question).tolist()

# Search ChromaDB
results = collection.query(
    query_embeddings=[question_embedding],
    n_results=3
)

# Display retrieved information
print("\nRelevant information from the PDF:\n")

for i, document in enumerate(results["documents"][0], start=1):
    print(f"\n--- Result {i} ---\n")
    print(document)

print("\nInformation retrieval completed!")