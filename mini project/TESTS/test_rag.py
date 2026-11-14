from pathlib import Path
import chromadb

# Find project folder
project_folder = Path(__file__).resolve().parent.parent

# Find ChromaDB
database_path = project_folder / "DATA" / "PROCESSED" / "chroma_db"

print("Starting RAG System Tests...\n")

# Test 1: Check database folder
if database_path.exists():
    print("TEST 1 PASSED: Database folder exists.")
else:
    print("TEST 1 FAILED: Database folder not found.")
    raise SystemExit

# Connect to database
client = chromadb.PersistentClient(path=str(database_path))

# Test 2: Check collection
try:
    collection = client.get_collection(name="official_statistics")
    print("TEST 2 PASSED: Collection exists.")
except Exception as error:
    print("TEST 2 FAILED:", error)
    raise SystemExit

# Test 3: Check stored documents
count = collection.count()

if count > 0:
    print("TEST 3 PASSED: Documents are stored.")
    print("Total stored chunks:", count)
else:
    print("TEST 3 FAILED: No documents found.")

# Test 4: Check document retrieval
results = collection.query(
    query_texts=["environmental accounts"],
    n_results=1
)

if results["documents"] and results["documents"][0]:
    print("TEST 4 PASSED: Information retrieved successfully.")
else:
    print("TEST 4 FAILED: No information retrieved.")

print("\nRAG SYSTEM TESTING COMPLETED!")