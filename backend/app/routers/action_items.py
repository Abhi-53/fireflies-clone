from typing import List
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.action_item import (
    ActionItemCreate,
    ActionItemUpdate,
    ActionItemComplete,
    ActionItemResponse,
)
from app.services import action_item_service

router = APIRouter(tags=["action_items"])


@router.get("/meetings/{meeting_id}/action-items", response_model=List[ActionItemResponse])
def list_action_items(
    meeting_id: int,
    db: Session = Depends(get_db),
):
    return action_item_service.list_action_items(db, meeting_id)


@router.post("/meetings/{meeting_id}/action-items", response_model=ActionItemResponse, status_code=status.HTTP_201_CREATED)
def create_action_item(
    meeting_id: int,
    data: ActionItemCreate,
    db: Session = Depends(get_db),
):
    return action_item_service.create_action_item(db, meeting_id, data)


@router.patch("/action-items/{item_id}", response_model=ActionItemResponse)
def update_action_item(
    item_id: int,
    data: ActionItemUpdate,
    db: Session = Depends(get_db),
):
    return action_item_service.update_action_item(db, item_id, data)


@router.patch("/action-items/{item_id}/complete", response_model=ActionItemResponse)
def toggle_complete(
    item_id: int,
    data: ActionItemComplete,
    db: Session = Depends(get_db),
):
    return action_item_service.toggle_complete(db, item_id, data.is_completed)


@router.delete("/action-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action_item(
    item_id: int,
    db: Session = Depends(get_db),
):
    action_item_service.delete_action_item(db, item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
