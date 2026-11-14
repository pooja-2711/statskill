
import chromadb
from sentence_transformers import SentenceTransformer
import ollama

# Connect to the existing ChromaDB database
client = chromadb.PersistentClient(
    path="DATA/PROCESSED/chroma_db"
)

collection = client.get_collection(
    name="official_statistics"
)

# Load the embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

print("\nStatSkill - AI Environmental Statistics Assistant")
print("Ask questions about EnviStats India 2024.")
print("Type 'exit' to quit.\n")

while True:
    question = input("You: ").strip()

    if question.lower() == "exit":
        print("Goodbye!")
        break

    if not question:
        continue

    # Convert question into an embedding
    query_embedding = embedding_model.encode(
        question
    ).tolist()

    # Retrieve relevant PDF chunks
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=5
    )

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]

    context_parts = []

    for i, document in enumerate(documents):
        source = metadatas[i] if metadatas else {}
        context_parts.append(
            f"Source {i + 1}: {source}\n{document}"
        )

    context = "\n\n".join(context_parts)

    # Generate an answer using retrieved PDF content
    response = ollama.chat(
        model="llama3.2:3b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are StatSkill, an assistant for India's "
                    "Official Statistical System. Answer using only "
                    "the provided EnviStats PDF context. "
                    "Do not invent statistics. If the context does "
                    "not contain the answer, clearly say so."
                )
            },
            {
                "role": "user",
                "content": (
                    f"PDF Context:\n{context}\n\n"
                    f"Question: {question}"
                )
            }
        ]
    )

    print("\nStatSkill:", response["message"]["content"])
    print("\n" + "-" * 60)
