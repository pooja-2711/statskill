from pathlib import Path

# Find the main project folder
project_folder = Path(__file__).resolve().parent.parent

# Locate the extracted PDF text
text_file = (
    project_folder
    / "DATA"
    / "PROCESSED"
    / "EnviStats_India_2024.txt"
)

# Check whether the file exists
if not text_file.exists():
    print("Error: Extracted data file not found!")
    print("Please check the DATA/PROCESSED folder.")
    raise SystemExit

# Read the extracted text
with open(text_file, "r", encoding="utf-8") as file:
    data = file.read()

print("====================================")
print("   OFFICIAL STATISTICS DATA EXPLORER")
print("====================================")

print("\nDataset: EnviStats India 2024")
print("Total characters:", len(data))

# Allow the user to search
while True:
    keyword = input(
        "\nEnter a keyword to search (or type exit to stop): "
    ).strip()

    if keyword.lower() == "exit":
        print("Thank you for using Dataset Explorer!")
        break

    if not keyword:
        print("Please enter a keyword.")
        continue

    # Find matching lines
    matching_lines = [
        line for line in data.splitlines()
        if keyword.lower() in line.lower()
    ]

    print("\nSearch results for:", keyword)
    print("Number of matching lines:", len(matching_lines))

    if matching_lines:
        for number, line in enumerate(matching_lines[:10], start=1):
            print(f"\n{number}. {line.strip()}")
    else:
        print("No matching information found.")