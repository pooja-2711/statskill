
import logging
from pathlib import Path
from uuid import uuid4

import chromadb
import pymupdf
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.dependencies import get_db
from app.models.pdf_document import PDFDocument
from app.models.user import User


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/pdf-learning",
    tags=["PDF Learning Assistant"],
)

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
CHROMA_DIR = Path(__file__).resolve().parents[2] / "data" / "pdf_chroma_db"

COLLECTION_NAME = "user_pdf_documents"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

MAX_FILE_SIZE = 25 * 1024 * 1024
MAX_PAGES = 500
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 150

_embedding_model = None
_collection = None


def get_resources():
    global _embedding_model, _collection

    if _embedding_model is None:
        _embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    if _collection is None:
        CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=str(CHROMA_DIR))
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )

    return _embedding_model, _collection


def split_page_text(text: str):
    text = " ".join(text.split())
    chunks = []
    start = 0

    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        if end >= len(text):
            break

        start = end - CHUNK_OVERLAP

    return chunks


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename or Path(file.filename).suffix.lower() != ".pdf":
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file.",
        )

    content = await file.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="PDF size must not exceed 25 MB.",
        )

    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF.",
        )

    safe_name = f"{uuid4().hex}.pdf"
    user_dir = UPLOAD_DIR / f"user_{current_user.id}"
    user_dir.mkdir(parents=True, exist_ok=True)
    file_path = user_dir / safe_name

    stored_chunk_ids = []

    try:
        with pymupdf.open(stream=content, filetype="pdf") as pdf:
            if pdf.is_encrypted:
                raise HTTPException(
                    status_code=400,
                    detail="Password-protected PDFs are not supported yet.",
                )

            if len(pdf) == 0 or len(pdf) > MAX_PAGES:
                raise HTTPException(
                    status_code=400,
                    detail="PDF must contain between 1 and 500 pages.",
                )

            page_count = len(pdf)
            page_chunks = []

            for page_number, page in enumerate(pdf, start=1):
                page_text = page.get_text("text")

                for chunk in split_page_text(page_text):
                    page_chunks.append({
                        "content": chunk,
                        "page": page_number,
                    })

        if not page_chunks:
            raise HTTPException(
                status_code=422,
                detail="No selectable text was found. Scanned PDFs need OCR support.",
            )

        file_path.write_bytes(content)

        document = PDFDocument(
            user_id=current_user.id,
            original_filename=Path(file.filename).name[:255],
            storage_path=str(file_path),
            page_count=page_count,
            status="processing",
        )

        db.add(document)
        db.flush()

        model, collection = get_resources()

        chunks = [item["content"] for item in page_chunks]
        embeddings = model.encode(chunks).tolist()

        stored_chunk_ids = [
            f"doc_{document.id}_{uuid4().hex}"
            for _ in chunks
        ]

        collection.add(
            ids=stored_chunk_ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=[
                {
                    "user_id": current_user.id,
                    "document_id": str(document.id),
                    "page": item["page"],
                }
                for item in page_chunks
            ],
        )

        document.status = "completed"

        db.commit()
        db.refresh(document)

        return {
            "message": "PDF uploaded and processed successfully.",
            "document": {
                "id": document.id,
                "filename": document.original_filename,
                "page_count": document.page_count,
                "chunk_count": len(chunks),
                "status": document.status,
            },
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        logger.exception("PDF upload processing failed")

        db.rollback()

        if stored_chunk_ids and _collection is not None:
            try:
                _collection.delete(ids=stored_chunk_ids)
            except Exception:
                logger.exception("Could not clean up PDF chunks from ChromaDB")

        if file_path.exists():
            try:
                file_path.unlink()
            except OSError:
                logger.exception("Could not remove failed PDF upload")

        raise HTTPException(
            status_code=500,
            detail="Could not process the PDF. Please try again.",
        )

    finally:
        await file.close()
