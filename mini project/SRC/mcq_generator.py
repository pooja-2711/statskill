import os
import json
import chromadb
import ollama
from sentence_transformers import SentenceTransformer

# Connect to existing ChromaDB
client = chromadb.PersistentClient(
    path="DATA/PROCESSED/chroma_db"
)

collection = client.get_collection(
    name="official_statistics"
)

# Load embedding model
embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


def generate_mcqs(topic, number_of_questions=5):

    # Convert topic into embedding
    topic_embedding = embedding_model.encode(
        topic
    ).tolist()

    # Retrieve relevant PDF content
    results = collection.query(
        query_embeddings=[topic_embedding],
        n_results=5
    )

    documents = results["documents"][0]

    if not documents:
        print("No relevant PDF content found.")
        return

    context = "\n\n".join(documents)

    # Ask Ollama to generate MCQs
    response = ollama.chat(
        model="llama3.2:3b",
        format="json",
        options={"temperature": 0.2},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are StatSkill, an educational quiz generator "
                    "for India's Official Statistical System. "
                    "Generate questions ONLY from the supplied PDF context. "
                    "Do not invent facts. If there is insufficient "
                    "information, return an empty questions list. "
                    "Each question must have exactly four options, "
                    "one correct answer, and an explanation. "
                    "Return valid JSON only."
                )
            },
            {
                "role": "user",
                "content": f"""
                Generate {number_of_questions} multiple-choice questions
                about: {topic}

                Use only this retrieved PDF content:

                {context}

                Return JSON in this structure:
                {{
                    "questions": [
                        {{
                            "question": "Question text",
                            "options": {{
                                "A": "Option 1",
                                "B": "Option 2",
                                "C": "Option 3",
                                "D": "Option 4"
                            }},
                            "correct_answer": "A",
                            "explanation": "Explanation based on the PDF"
                        }}
                    ]
                }}
                """
            }
        ]
    )

    # Parse generated JSON
    try:
        data = json.loads(
            response["message"]["content"]
        )
    except json.JSONDecodeError:
        print("Could not read the generated MCQs.")
        return


    questions = data.get("questions", [])

    if not questions:
        print("Insufficient information to generate MCQs.")
        return

    # Validate generated questions

    valid_questions = []
    seen_questions = set()

    for question in questions:

        options = question.get("options", {})

        # Check exactly four options
        if not isinstance(options, dict) or set(options.keys()) != {"A", "B", "C", "D"}:
            print("Skipped question: Invalid option structure.")
            continue

        # Check duplicate options
        # Check for empty options
        if any(
            not isinstance(options[key], str) or not options[key].strip()
            for key in ["A", "B", "C", "D"]
        ):
            print("Skipped question: Empty or invalid option.")
            continue        
        option_values = [
            str(options[key]).strip().casefold()
            for key in ["A", "B", "C", "D"]
        ]

        if len(set(option_values)) != 4:
            print("Skipped question: Duplicate options.")
            continue

        # Check correct answer
        if question.get("correct_answer") not in ["A", "B", "C", "D"]:
            print("Skipped question: Invalid correct answer.")
            continue

        # Check question and explanation
        if not isinstance(question.get("question"), str) or not question["question"].strip():
            print("Skipped question: Missing or invalid question.")
            continue

        if not isinstance(question.get("explanation"), str) or not question["explanation"].strip():
            print("Skipped question: Missing or invalid explanation.")
            continue

        # Check duplicate questions
        question_text = " ".join(question["question"].split()).casefold()

        if question_text in seen_questions:
            print("Skipped question: Duplicate question.")
            continue

        seen_questions.add(question_text)
        valid_questions.append(question)

    if not valid_questions:
        print("No valid MCQs generated.")
        return

    print(f"\nValid MCQs: {len(valid_questions)}")

    # Save validated MCQs
    os.makedirs("OUTPUT", exist_ok=True)

    output_path = "OUTPUT/generated_mcqs.json"

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(
            {"questions": valid_questions},
            file,
            indent=4,
            ensure_ascii=False
        )

    print(f"MCQs saved successfully: {output_path}")

    # Display questions
    print("\n========== STATSKILL MCQ QUIZ ==========\n")

    for index, question in enumerate(valid_questions, start=1):

        print(f"Q{index}. {question['question']}")

        for key, value in question["options"].items():
            print(f"   {key}. {value}")

        print(f"\nCorrect Answer: {question['correct_answer']}")
        print(f"Explanation: {question['explanation']}")
        print("\n" + "-" * 50)



if __name__ == "__main__":

    print("\nStatSkill - Automatic MCQ Generator")

    topic = input(
        "\nEnter a topic from EnviStats India 2024: "
    ).strip()

    if topic:
        generate_mcqs(topic)
    else:
        print("Please enter a valid topic.")
