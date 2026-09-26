from typing import List
from sqlalchemy.orm import Session

from app.models.action_item import ActionItem
from app.schemas.action_item import ActionItemCreate, ActionItemUpdate
from app.services.meeting_service import get_meeting
from app.utils.exceptions import NotFoundError, BadRequestError


def get_action_item(db: Session, item_id: int) -> ActionItem:
    item = db.query(ActionItem).filter(ActionItem.id == item_id).first()
    if not item:
        raise NotFoundError(
            code="ACTION_ITEM_NOT_FOUND",
            message=f"Action item with id {item_id} does not exist."
        )
    return item


def list_action_items(db: Session, meeting_id: int) -> List[ActionItem]:
    meeting = get_meeting(db, meeting_id)
    items = (
        db.query(ActionItem)
        .filter(ActionItem.meeting_id == meeting.id)
        .order_by(ActionItem.id.asc())
        .all()
    )
    return items


def create_action_item(db: Session, meeting_id: int, data: ActionItemCreate) -> ActionItem:
    meeting = get_meeting(db, meeting_id)
    clean_text = data.text.strip()
    if not clean_text:
        raise BadRequestError("Action item text cannot be empty.")

    item = ActionItem(
        meeting_id=meeting.id,
        text=clean_text,
        assignee=data.assignee.strip() if data.assignee else None,
        is_completed=0,
        due_date=data.due_date.strip() if data.due_date else None,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_action_item(db: Session, item_id: int, data: ActionItemUpdate) -> ActionItem:
    item = get_action_item(db, item_id)

    if data.text is not None:
        clean_text = data.text.strip()
        if not clean_text:
            raise BadRequestError("Action item text cannot be empty.")
        item.text = clean_text

    if data.assignee is not None:
        item.assignee = data.assignee.strip() if data.assignee.strip() else None

    if data.due_date is not None:
        item.due_date = data.due_date.strip() if data.due_date.strip() else None

    db.commit()
    db.refresh(item)
    return item


def toggle_complete(db: Session, item_id: int, is_completed: bool) -> ActionItem:
    item = get_action_item(db, item_id)
    item.is_completed = 1 if is_completed else 0
    db.commit()
    db.refresh(item)
    return item


def delete_action_item(db: Session, item_id: int) -> None:
    item = get_action_item(db, item_id)
    db.delete(item)
    db.commit()
