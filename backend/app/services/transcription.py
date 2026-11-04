"""
VoxDesk AI — Groq Free Plan Whisper transcription service
Never uses a paid tier. Raises QuotaExhaustedError on 429/quota errors.
"""
import logging
import os

from app.config import settings

logger = logging.getLogger(__name__)


class TranscriptionError(Exception):
    """General transcription failure."""


class QuotaExhaustedError(TranscriptionError):
    """Groq free quota is exhausted. Do not retry against a paid tier."""


def transcribe_audio(file_path: str, original_filename: str) -> dict:
    """
    Transcribe audio using Groq Free Plan Whisper.
    Returns dict with 'transcript' and optionally 'language'.
    Deletes no files — the caller owns cleanup.
    """
    if not settings.GROQ_API_KEY:
        raise TranscriptionError("GROQ_API_KEY is not configured.")

    try:
        from groq import Groq
        from groq import RateLimitError, APIStatusError
    except ImportError as exc:
        raise TranscriptionError(f"groq package not installed: {exc}") from exc

    client = Groq(api_key=settings.GROQ_API_KEY)

    # Use a safe filename (no path traversal)
    safe_filename = os.path.basename(original_filename) or "complaint.webm"

    try:
        with open(file_path, "rb") as audio_file:
            result = client.audio.transcriptions.create(
                file=(safe_filename, audio_file.read()),
                model=settings.WHISPER_MODEL,
                language=settings.WHISPER_LANGUAGE,
                response_format="json",
            )

        transcript = (result.text or "").strip()
        if not transcript:
            raise TranscriptionError("Whisper returned an empty transcript.")

        return {
            "transcript": transcript,
            "language": getattr(result, "language", settings.WHISPER_LANGUAGE),
        }

    except RateLimitError as exc:
        # 429 — Groq free quota exhausted. Hard stop — no paid retry.
        logger.warning("Groq rate limit hit (free quota). No paid retry. %s", exc)
        raise QuotaExhaustedError("Groq free-plan quota exhausted.") from exc

    except APIStatusError as exc:
        status = getattr(exc, "status_code", None)
        if status in (402, 429):
            raise QuotaExhaustedError(f"Groq billing/quota error ({status}).") from exc
        raise TranscriptionError(f"Groq API error ({status}): {exc}") from exc

    except Exception as exc:
        raise TranscriptionError(f"Transcription failed: {exc}") from exc

