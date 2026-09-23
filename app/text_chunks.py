"""Safe, readable chunks for sending long course material to an AI model."""

MAX_CHUNK_CHARACTERS = 60_000
MAX_GENERATION_CHUNKS = 4


class TextChunkingError(ValueError):
    """Raised when material is too large for Lexicon's current safe limit."""


def split_text_for_generation(text: str) -> list[str]:
    """Split text into bounded chunks without cutting through ordinary paragraphs.

    A long paragraph is split on word boundaries as a fallback. The fixed chunk cap
    makes the maximum number of OpenAI requests predictable for the student.
    """
    paragraphs = [paragraph.strip() for paragraph in text.splitlines() if paragraph.strip()]
    chunks: list[str] = []
    current_parts: list[str] = []
    current_length = 0

    for paragraph in paragraphs:
        for piece in _split_long_paragraph(paragraph):
            separator_length = 1 if current_parts else 0
            if current_length + separator_length + len(piece) > MAX_CHUNK_CHARACTERS:
                chunks.append("\n".join(current_parts))
                current_parts = [piece]
                current_length = len(piece)
            else:
                current_parts.append(piece)
                current_length += separator_length + len(piece)

    if current_parts:
        chunks.append("\n".join(current_parts))

    if len(chunks) > MAX_GENERATION_CHUNKS:
        maximum_characters = MAX_CHUNK_CHARACTERS * MAX_GENERATION_CHUNKS
        raise TextChunkingError(
            "This material contains more than "
            f"{maximum_characters:,} readable characters. Please split it into smaller files."
        )

    return chunks


def _split_long_paragraph(paragraph: str) -> list[str]:
    """Break an unusually long paragraph at spaces while preserving every word."""
    if len(paragraph) <= MAX_CHUNK_CHARACTERS:
        return [paragraph]

    words = paragraph.split()
    pieces: list[str] = []
    current_words: list[str] = []
    current_length = 0

    for word in words:
        separator_length = 1 if current_words else 0
        if current_length + separator_length + len(word) > MAX_CHUNK_CHARACTERS:
            pieces.append(" ".join(current_words))
            current_words = [word]
            current_length = len(word)
        else:
            current_words.append(word)
            current_length += separator_length + len(word)

    if current_words:
        pieces.append(" ".join(current_words))

    return pieces
