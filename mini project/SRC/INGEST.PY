from pathlib import Path
import fitz  # PyMuPDF

# Find the main project folder
project_folder = Path(__file__).resolve().parent.parent

# Locate the PDF file
pdf_path = project_folder / "DATA" / "RAW" / "EnviStats_India_2024.pdf"

# Choose where to save the extracted text
output_folder = project_folder / "DATA" / "PROCESSED"
output_folder.mkdir(parents=True, exist_ok=True)

output_file = output_folder / "EnviStats_India_2024.txt"

# Check whether the PDF exists
if not pdf_path.exists():
    print("ERROR: PDF file not found!")
else:
    print("Reading PDF...")

    extracted_text = ""

    # Open and read the PDF
    with fitz.open(pdf_path) as pdf:
        print("Total pages:", len(pdf))

        for page_number, page in enumerate(pdf, start=1):
            extracted_text += page.get_text() + "\n"

    # Save extracted text
    output_file.write_text(extracted_text, encoding="utf-8")

    print("PDF text extraction completed!")
    print("Saved at:", output_file)