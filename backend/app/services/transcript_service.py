import re
import json
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.meeting import Meeting
from app.models.speaker import Speaker
from app.models.transcript import TranscriptSegment
from app.services.meeting_service import get_meeting
from app.utils.exceptions import NotFoundError, BadRequestError

PALETTE = [
    "#4F46E5",  # Indigo
    "#059669",  # Emerald
    "#D97706",  # Amber
    "#DC2626",  # Rose
    "#7C3AED",  # Violet
    "#2563EB",  # Blue
    "#0891B2",  # Cyan
    "#DB2777",  # Pink
]


def time_to_seconds(time_str: str) -> float:
    """Parses HH:MM:SS or MM:SS or SS into float seconds."""
    parts = time_str.strip().split(":")
    try:
        if len(parts) == 3:
            return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
        elif len(parts) == 2:
            return float(parts[0]) * 60 + float(parts[1])
        elif len(parts) == 1:
            return float(parts[0])
    except ValueError:
        pass
    return 0.0


def parse_raw_transcript(raw_text: str) -> List[Dict[str, Any]]:
    """
    Parses raw transcript text into structured segment dicts.
    Supports:
    - JSON array: [{"speaker": "...", "text": "...", "start_time_seconds": 0.0}]
    - Timestamped format: [HH:MM:SS] Speaker: Text or (MM:SS) Speaker: Text
    - WebVTT format
    - Standard Speaker: Text format
    """
    cleaned = raw_text.strip()
    if not cleaned:
        return []

    # Check for JSON input
    if (cleaned.startswith("[") and cleaned.endswith("]")) or (cleaned.startswith("{") and cleaned.endswith("}")):
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, list):
                segments = []
                for idx, item in enumerate(parsed):
                    speaker = item.get("speaker") or item.get("speaker_name") or "Speaker 1"
                    text = item.get("text") or item.get("content") or ""
                    start = float(item.get("start_time_seconds", idx * 5.0))
                    end = float(item.get("end_time_seconds", start + 4.0)) if item.get("end_time_seconds") is not None else None
                    segments.append({
                        "speaker": speaker,
                        "text": text,
                        "start_time_seconds": start,
                        "end_time_seconds": end,
                    })
                return segments
        except Exception:
            pass  # Fall back to regex parsing

    # Regex for [00:01:23] Speaker: Text or 00:01:23 Speaker: Text
    timestamp_speaker_pattern = re.compile(
        r"^(?:\[?(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)\]?)\s*([^:\n]+):\s*(.+)$",
        re.MULTILINE
    )
    # Regex for Speaker: Text without timestamp
    speaker_only_pattern = re.compile(r"^([^:\n]+):\s*(.+)$", re.MULTILINE)

    segments = []
    lines = cleaned.splitlines()
    curr_time = 0.0

    for idx, line in enumerate(lines):
        line = line.strip()
        if not line or line.startswith("WEBVTT") or line.startswith("NOTE"):
            continue

        ts_match = timestamp_speaker_pattern.match(line)
        if ts_match:
            time_str, speaker, text = ts_match.groups()
            curr_time = time_to_seconds(time_str)
            segments.append({
                "speaker": speaker.strip(),
                "text": text.strip(),
                "start_time_seconds": curr_time,
                "end_time_seconds": curr_time + 4.0,
            })
            continue

        spk_match = speaker_only_pattern.match(line)
        if spk_match:
            speaker, text = spk_match.groups()
            # If speaker looks like a timestamp, ignore
            if not re.match(r"^\d{1,2}:\d{2}", speaker):
                segments.append({
                    "speaker": speaker.strip(),
                    "text": text.strip(),
                    "start_time_seconds": curr_time,
                    "end_time_seconds": curr_time + 4.0,
                })
                curr_time += 4.0
                continue

        # If none matched, treat as continuation of previous line or general text
        if segments:
            segments[-1]["text"] += " " + line
        else:
            segments.append({
                "speaker": "Speaker 1",
                "text": line,
                "start_time_seconds": curr_time,
                "end_time_seconds": curr_time + 4.0,
            })
            curr_time += 4.0

    return segments


def get_transcript(db: Session, meeting_id: int) -> Dict[str, Any]:
    meeting = get_meeting(db, meeting_id)

    speakers = db.query(Speaker).filter(Speaker.meeting_id == meeting.id).all()
    speakers_map = {s.id: s for s in speakers}

    segments = (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.meeting_id == meeting.id)
        .order_by(TranscriptSegment.sequence_index.asc())
        .all()
    )

    segment_responses = []
    for seg in segments:
        spk = speakers_map.get(seg.speaker_id)
        spk_name = spk.name if spk else "Unknown"
        spk_color = spk.color_hex if spk else None

        segment_responses.append({
            "id": seg.id,
            "meeting_id": seg.meeting_id,
            "speaker_id": seg.speaker_id,
            "speaker_name": spk_name,
            "speaker_color": spk_color,
            "start_time_seconds": seg.start_time_seconds,
            "end_time_seconds": seg.end_time_seconds,
            "text": seg.text,
            "sequence_index": seg.sequence_index,
        })

    return {
        "segments": segment_responses,
        "speakers": speakers,
    }


def parse_and_save_transcript(db: Session, meeting_id: int, raw_text: str) -> Dict[str, Any]:
    meeting = get_meeting(db, meeting_id)
    raw_segments = parse_raw_transcript(raw_text)

    if not raw_segments:
        raise BadRequestError("Unable to parse any transcript segments from provided text.")

    # Remove existing segments and speakers for this meeting
    db.query(TranscriptSegment).filter(TranscriptSegment.meeting_id == meeting.id).delete()
    db.query(Speaker).filter(Speaker.meeting_id == meeting.id).delete()
    db.flush()

    # Create speakers
    speaker_cache: Dict[str, Speaker] = {}
    color_idx = 0

    max_end_time = 0.0

    for idx, seg in enumerate(raw_segments):
        speaker_name = seg["speaker"]
        if speaker_name not in speaker_cache:
            color = PALETTE[color_idx % len(PALETTE)]
            color_idx += 1
            spk = Speaker(
                meeting_id=meeting.id,
                name=speaker_name,
                color_hex=color
            )
            db.add(spk)
            db.flush()
            speaker_cache[speaker_name] = spk

        spk_obj = speaker_cache[speaker_name]
        start_sec = seg["start_time_seconds"]
        end_sec = seg.get("end_time_seconds")
        if end_sec is not None and end_sec > max_end_time:
            max_end_time = end_sec
        elif start_sec > max_end_time:
            max_end_time = start_sec

        transcript_segment = TranscriptSegment(
            meeting_id=meeting.id,
            speaker_id=spk_obj.id,
            start_time_seconds=start_sec,
            end_time_seconds=end_sec,
            text=seg["text"],
            sequence_index=idx,
        )
        db.add(transcript_segment)

    # Update meeting duration if segments extend beyond current duration
    if int(max_end_time) > meeting.duration_seconds:
        meeting.duration_seconds = int(max_end_time)

    db.commit()

    return get_transcript(db, meeting.id)


def search_transcript(db: Session, meeting_id: int, query: str) -> List[Dict[str, Any]]:
    meeting = get_meeting(db, meeting_id)
    if not query or not query.strip():
        return []

    q_lower = query.strip().lower()
    segments = (
        db.query(TranscriptSegment, Speaker.name)
        .join(Speaker, TranscriptSegment.speaker_id == Speaker.id)
        .filter(TranscriptSegment.meeting_id == meeting.id)
        .order_by(TranscriptSegment.sequence_index.asc())
        .all()
    )

    matches = []
    for seg, speaker_name in segments:
        text_lower = seg.text.lower()
        if q_lower in text_lower:
            start_idx = text_lower.find(q_lower)
            snippet_start = max(0, start_idx - 30)
            snippet_end = min(len(seg.text), start_idx + len(query) + 40)
            snippet = seg.text[snippet_start:snippet_end]
            if snippet_start > 0:
                snippet = "..." + snippet
            if snippet_end < len(seg.text):
                snippet = snippet + "..."

            matches.append({
                "segment_id": seg.id,
                "start_time_seconds": seg.start_time_seconds,
                "speaker_name": speaker_name,
                "snippet": snippet,
            })

    return matches
