from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.models.transcript import TranscriptSegment
from app.models.speaker import Speaker
from app.models.summary import Summary


def global_search(db: Session, query: str) -> Dict[str, Any]:
    if not query or not query.strip():
        return {
            "query": query,
            "meetings": [],
            "transcripts": [],
            "summaries": [],
        }

    search_term = f"%{query.strip()}%"

    # Search in meetings title
    matching_meetings = (
        db.query(Meeting)
        .filter(Meeting.title.ilike(search_term))
        .limit(10)
        .all()
    )
    meeting_results = [
        {
            "id": m.id,
            "title": m.title,
            "meeting_date": m.meeting_date,
            "match_field": "title",
        }
        for m in matching_meetings
    ]

    # Search in transcript segments
    matching_transcripts = (
        db.query(TranscriptSegment, Meeting.title, Speaker.name)
        .join(Meeting, TranscriptSegment.meeting_id == Meeting.id)
        .join(Speaker, TranscriptSegment.speaker_id == Speaker.id)
        .filter(TranscriptSegment.text.ilike(search_term))
        .limit(15)
        .all()
    )
    transcript_results = []
    q_lower = query.strip().lower()
    for seg, meeting_title, speaker_name in matching_transcripts:
        idx = seg.text.lower().find(q_lower)
        start = max(0, idx - 30)
        end = min(len(seg.text), idx + len(query) + 40)
        snippet = seg.text[start:end]
        if start > 0:
            snippet = "..." + snippet
        if end < len(seg.text):
            snippet = snippet + "..."

        transcript_results.append({
            "meeting_id": seg.meeting_id,
            "meeting_title": meeting_title,
            "segment_id": seg.id,
            "speaker_name": speaker_name,
            "start_time_seconds": seg.start_time_seconds,
            "text_snippet": snippet,
        })

    # Search in summaries
    matching_summaries = (
        db.query(Summary, Meeting.title)
        .join(Meeting, Summary.meeting_id == Meeting.id)
        .filter(Summary.overview_text.ilike(search_term))
        .limit(10)
        .all()
    )
    summary_results = []
    for summ, meeting_title in matching_summaries:
        idx = summ.overview_text.lower().find(q_lower)
        start = max(0, idx - 40)
        end = min(len(summ.overview_text), idx + len(query) + 60)
        snippet = summ.overview_text[start:end]
        if start > 0:
            snippet = "..." + snippet
        if end < len(summ.overview_text):
            snippet = snippet + "..."

        summary_results.append({
            "meeting_id": summ.meeting_id,
            "meeting_title": meeting_title,
            "overview_snippet": snippet,
        })

    return {
        "query": query,
        "meetings": meeting_results,
        "transcripts": transcript_results,
        "summaries": summary_results,
    }
