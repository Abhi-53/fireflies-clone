from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, status, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.transcript import (
    TranscriptResponse,
    TranscriptSearchResponse,
)
from app.services import transcript_service, meeting_service
from app.utils.exceptions import BadRequestError

router = APIRouter(prefix="/meetings", tags=["transcripts"])


@router.get("/{meeting_id}/transcript", response_model=TranscriptResponse)
def get_transcript(
    meeting_id: int,
    db: Session = Depends(get_db),
):
    return transcript_service.get_transcript(db, meeting_id)


@router.post("/{meeting_id}/transcript", response_model=TranscriptResponse, status_code=status.HTTP_201_CREATED)
async def upload_transcript(
    meeting_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    text_content = ""
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body = await request.json()
            if isinstance(body, dict):
                text_content = body.get("raw_text", "")
            elif isinstance(body, list):
                import json
                text_content = json.dumps(body)
        except Exception:
            raise BadRequestError("Malformed JSON payload.")
    elif "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        if "file" in form:
            upload_file = form["file"]
            if hasattr(upload_file, "read"):
                file_bytes = await upload_file.read()
                text_content = file_bytes.decode("utf-8", errors="replace")
        if not text_content and "raw_text" in form:
            text_content = str(form["raw_text"])
    else:
        # Fallback: try reading raw body text
        raw_body = await request.body()
        if raw_body:
            text_content = raw_body.decode("utf-8", errors="replace")

    if not text_content or not text_content.strip():
        raise BadRequestError("No transcript text or file content provided.")

    return transcript_service.parse_and_save_transcript(db, meeting_id, text_content)


@router.get("/{meeting_id}/transcript/search", response_model=TranscriptSearchResponse)
def search_transcript(
    meeting_id: int,
    q: str = Query(..., description="Query substring to search within transcript"),
    db: Session = Depends(get_db),
):
    matches = transcript_service.search_transcript(db, meeting_id, q)
    return {"matches": matches}


@router.get("/{meeting_id}/export")
def export_meeting(
    meeting_id: int,
    format: str = Query("md", description="Export format: 'txt', 'md', or 'json'"),
    db: Session = Depends(get_db),
):
    meeting = meeting_service.get_meeting(db, meeting_id)
    transcript_data = transcript_service.get_transcript(db, meeting_id)

    if format == "json":
        import json
        data = {
            "title": meeting.title,
            "meeting_date": meeting.meeting_date,
            "duration_seconds": meeting.duration_seconds,
            "participants": [p.name for p in meeting.participants],
            "transcript": transcript_data["segments"],
        }
        return Response(content=json.dumps(data, indent=2), media_type="application/json")

    # Format text / markdown
    lines = [
        f"# {meeting.title}",
        f"**Date:** {meeting.meeting_date}",
        f"**Participants:** {', '.join(p.name for p in meeting.participants)}",
        "",
        "## Transcript",
        "",
    ]
    for seg in transcript_data["segments"]:
        sec = int(seg["start_time_seconds"])
        m, s = divmod(sec, 60)
        h, m = divmod(m, 60)
        ts_str = f"[{h:02d}:{m:02d}:{s:02d}]"
        lines.append(f"{ts_str} **{seg['speaker_name']}**: {seg['text']}")

    output = "\n".join(lines)
    media_type = "text/markdown" if format == "md" else "text/plain"
    return Response(content=output, media_type=media_type)
