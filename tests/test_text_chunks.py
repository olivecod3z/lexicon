import pytest

from app.text_chunks import (
    MAX_CHUNK_CHARACTERS,
    TextChunkingError,
    split_text_for_generation,
)


def test_splitter_keeps_all_paragraphs_within_the_chunk_limit() -> None:
    paragraphs = ["A" * 29_000, "B" * 29_000, "C" * 29_000]

    chunks = split_text_for_generation("\n".join(paragraphs))

    assert len(chunks) == 2
    assert all(len(chunk) <= MAX_CHUNK_CHARACTERS for chunk in chunks)
    assert "".join(chunks).replace("\n", "") == "".join(paragraphs)


def test_splitter_rejects_more_than_four_generation_chunks() -> None:
    material = "\n".join("A" * MAX_CHUNK_CHARACTERS for _ in range(5))

    with pytest.raises(TextChunkingError, match="240,000"):
        split_text_for_generation(material)
