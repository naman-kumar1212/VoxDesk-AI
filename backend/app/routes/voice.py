"""
VoxDesk AI — Voice transcription endpoint
POST /api/voice/transcribe  — Groq Free Plan Whisper STT
"""
import logging
import os
import tempfile

from flask import Blueprint, jsonify, request
from app.config import settings
from app.services.transcription import transcribe_audio, TranscriptionError, QuotaExhaustedError

logger = logging.getLogger(__name__)

voice_bp = Blueprint("voice", __name__)

ALLOWED_EXTENSIONS = {".webm", ".wav", ".mp3", ".m4a", ".flac", ".ogg", ".mp4"}
ALLOWED_MIME_PREFIXES = {"audio/", "video/webm"}  # webm is video/webm but contains audio


def _error(code: str, message: str, status: int):
    return jsonify({"success": False, "data": None, "error": {"code": code, "message": message}}), status


@voice_bp.post("/voice/transcribe")
def transcribe():
    # 1. Confirm file field exists
    if "audio" not in request.files:
        return _error("MISSING_AUDIO", "No audio file provided. Use field name 'audio'.", 400)

    audio_file = request.files["audio"]

    if not audio_file.filename:
        return _error("MISSING_AUDIO", "Audio file has no filename.", 400)

    # 2. Validate extension
    _, ext = os.path.splitext(audio_file.filename.lower())
    if ext not in ALLOWED_EXTENSIONS:
        return _error(
            "UNSUPPORTED_FORMAT",
            f"Unsupported audio format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
            415,
        )

    # 3. Read bytes and check size
    audio_bytes = audio_file.read()
    if not audio_bytes:
        return _error("EMPTY_AUDIO", "Audio file is empty.", 400)

    if len(audio_bytes) > settings.MAX_AUDIO_BYTES:
        return _error(
            "AUDIO_TOO_LARGE",
            f"Audio exceeds {settings.MAX_AUDIO_MB} MB limit.",
            413,
        )

    # 4. Write to temp file and transcribe
    suffix = ext if ext else ".webm"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        result = transcribe_audio(tmp_path, audio_file.filename)

        return jsonify({
            "success": True,
            "data": {
                "transcript": result["transcript"],
                "language": result.get("language", "en"),
                "provider": "groq",
                "model": settings.WHISPER_MODEL,
            },
            "error": None,
        }), 200

    except QuotaExhaustedError as exc:
        logger.warning("Groq quota exhausted: %s", exc)
        return _error(
            "QUOTA_EXHAUSTED",
            "Free transcription quota is unavailable. Enter or paste the complaint text, or retry later. No paid service was called.",
            429,
        )
    except TranscriptionError as exc:
        logger.error("Transcription error: %s", exc)
        return _error("TRANSCRIPTION_FAILED", str(exc), 502)
    except Exception as exc:
        logger.error("Unexpected transcription error: %s", exc)
        return _error("INTERNAL_ERROR", "An unexpected error occurred during transcription.", 500)
    finally:
        # Always delete temp audio — do not persist raw audio
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

