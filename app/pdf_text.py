"""Utilities for reading student-uploaded PDF files."""

from io import BytesIO

from pypdf import PdfReader


class PdfExtractionError(ValueError):
    """Raised when a PDF cannot be read into useful text."""


def extract_text(pdf_bytes: bytes) -> tuple[str, int]:
    """Return all readable text and the number of pages in a PDF.

    This deliberately does not use OCR. Scanned PDFs will be handled in a later
    milestone after the basic text-PDF workflow is reliable.
    """
    try:
        reader = PdfReader(BytesIO(pdf_bytes))
        text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except Exception as error:
        raise PdfExtractionError("The uploaded file is not a readable PDF.") from error

    if not text:
        raise PdfExtractionError(
            "No selectable text was found. This may be a scanned PDF; OCR is not supported yet."
        )

    return text, len(reader.pages)

