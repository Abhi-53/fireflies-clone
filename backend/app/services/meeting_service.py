from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from datetime import datetime

from app.models.meeting import Meeting
from app.models.participant import Participant, MeetingParticipant
from app.models.action_item import ActionItem
from app.schemas.meeting import MeetingCreate, MeetingUpdate
from app.utils.exceptions import NotFoundError, BadRequestError


def get_or_create_participant(db: Session, name: str, email: Optional[str] = None) -> Participant:
    clean_name = name.strip()
    if not clean_name:
        raise BadRequestError("Participant name cannot be empty")
    participant = db.query(Participant).filter(Participant.name == clean_name).first()
    if not participant:
        participant = Participant(name=clean_name, email=email)
        db.add(participant)
        db.flush()
    return participant


def list_meetings(
    db: Session,
    search: Optional[str] = None,
    participant: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort: str = "recent",
    limit: int = 20,
    offset: int = 0,
):
    query = db.query(Meeting)

    # Search filter on title or transcript content
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(Meeting.title.ilike(search_term))

    # Participant filter
    if participant and participant.strip():
        query = query.join(Meeting.participants).filter(
            Participant.name.ilike(f"%{participant.strip()}%")
        )

    # Date range filters
    if date_from:
        query = query.filter(Meeting.meeting_date >= date_from)
    if date_to:
        query = query.filter(Meeting.meeting_date <= date_to)

    # Sorting
    if sort == "oldest":
        query = query.order_by(asc(Meeting.meeting_date), asc(Meeting.id))
    else:  # default 'recent'
        query = query.order_by(desc(Meeting.meeting_date), desc(Meeting.id))

    total = query.distinct().count()
    meetings = query.distinct().offset(offset).limit(limit).all()

    # Pre-calculate action items counts
    meeting_ids = [m.id for m in meetings]
    action_counts = {}
    if meeting_ids:
        counts = (
            db.query(ActionItem.meeting_id, func.count(ActionItem.id))
            .filter(ActionItem.meeting_id.in_(meeting_ids))
            .group_by(ActionItem.meeting_id)
            .all()
        )
        action_counts = {m_id: count for m_id, count in counts}

    items = []
    for m in meetings:
        item_dict = {
            "id": m.id,
            "title": m.title,
            "meeting_date": m.meeting_date,
            "duration_seconds": m.duration_seconds,
            "media_url": m.media_url,
            "participants": m.participants,
            "action_items_count": action_counts.get(m.id, 0),
            "created_at": str(m.created_at),
            "updated_at": str(m.updated_at),
        }
        items.append(item_dict)

    return items, total


def get_meeting(db: Session, meeting_id: int) -> Meeting:
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise NotFoundError(
            code="MEETING_NOT_FOUND",
            message=f"Meeting with id {meeting_id} does not exist."
        )
    return meeting


def create_meeting(db: Session, data: MeetingCreate) -> Meeting:
    # Resolve participants
    participant_objs = []
    for p_name in data.participants:
        if p_name.strip():
            participant_objs.append(get_or_create_participant(db, p_name))

    meeting = Meeting(
        title=data.title.strip(),
        meeting_date=data.meeting_date,
        media_url=data.media_url,
        duration_seconds=0,
    )
    meeting.participants = participant_objs
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    # If transcript_text is provided, parse and save it
    if data.transcript_text and data.transcript_text.strip():
        from app.services.transcript_service import parse_and_save_transcript
        parse_and_save_transcript(db, meeting.id, data.transcript_text)
        db.refresh(meeting)

    return meeting


def update_meeting(db: Session, meeting_id: int, data: MeetingUpdate) -> Meeting:
    meeting = get_meeting(db, meeting_id)

    if data.title is not None:
        meeting.title = data.title.strip()
    if data.meeting_date is not None:
        meeting.meeting_date = data.meeting_date
    if data.media_url is not None:
        meeting.media_url = data.media_url
    if data.duration_seconds is not None:
        meeting.duration_seconds = data.duration_seconds

    if data.participants is not None:
        participant_objs = []
        for p_name in data.participants:
            if p_name.strip():
                participant_objs.append(get_or_create_participant(db, p_name))
        meeting.participants = participant_objs

    from datetime import timezone
    meeting.updated_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(meeting)
    return meeting


def delete_meeting(db: Session, meeting_id: int) -> None:
    meeting = get_meeting(db, meeting_id)
    db.delete(meeting)
    db.commit()
