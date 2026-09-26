import json
import logging
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.meeting import Meeting
from app.models.summary import Summary
from app.models.topic import Topic
from app.schemas.meeting import MeetingCreate
from app.schemas.action_item import ActionItemCreate
from app.services import meeting_service, transcript_service, action_item_service

logger = logging.getLogger("seed")


def seed_if_empty(db: Session) -> bool:
    """
    Checks if meetings table is empty. If empty, populates it from seed fixtures
    using the service layer to ensure identical code paths and data integrity.
    """
    count = db.query(func.count(Meeting.id)).scalar()
    if count and count > 0:
        logger.info(f"Database already contains {count} meetings. Skipping seed.")
        return False

    logger.info("Database is empty. Seeding realistic sample meetings...")

    fixture_path = Path(__file__).parent / "seed_data" / "fixtures.json"
    if not fixture_path.exists():
        logger.warning(f"Seed fixture file not found at {fixture_path}")
        return False

    with open(fixture_path, "r", encoding="utf-8") as f:
        fixtures = json.load(f)

    for item in fixtures:
        # 1. Create meeting using meeting_service
        create_schema = MeetingCreate(
            title=item["title"],
            meeting_date=item["meeting_date"],
            media_url=item.get("media_url"),
            participants=item.get("participants", []),
        )
        meeting = meeting_service.create_meeting(db, create_schema)

        # 2. Parse and save transcript segments using transcript_service
        raw_transcript = item.get("raw_transcript")
        if raw_transcript:
            transcript_service.parse_and_save_transcript(db, meeting.id, raw_transcript)

        # 3. Create Summary and Topics
        summary_text = item.get("summary")
        if summary_text:
            summary = Summary(
                meeting_id=meeting.id,
                overview_text=summary_text,
            )
            db.add(summary)

        topics_data = item.get("topics", [])
        for t_data in topics_data:
            topic = Topic(
                meeting_id=meeting.id,
                title=t_data["title"],
                start_time_seconds=t_data.get("start_time_seconds"),
                order_index=t_data["order_index"],
            )
            db.add(topic)

        # 4. Create Action Items using action_item_service
        action_items_data = item.get("action_items", [])
        for ai_data in action_items_data:
            ai_schema = ActionItemCreate(
                text=ai_data["text"],
                assignee=ai_data.get("assignee"),
                due_date=ai_data.get("due_date"),
            )
            created_ai = action_item_service.create_action_item(db, meeting.id, ai_schema)
            if ai_data.get("is_completed"):
                action_item_service.toggle_complete(db, created_ai.id, True)

        db.commit()

    logger.info(f"Successfully seeded {len(fixtures)} meetings into the database.")
    return True


if __name__ == "__main__":
    from app.core.database import SessionLocal, Base, engine
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
