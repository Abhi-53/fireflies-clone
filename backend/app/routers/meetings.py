from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.meeting import (
    MeetingCreate,
    MeetingUpdate,
    MeetingDetail,
    MeetingListResponse,
)
from app.services import meeting_service

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=MeetingListResponse)
def list_meetings(
    search: Optional[str] = Query(None, description="Search term for meeting title"),
    participant: Optional[str] = Query(None, description="Filter by participant name"),
    date_from: Optional[str] = Query(None, description="Filter meetings on or after this ISO date"),
    date_to: Optional[str] = Query(None, description="Filter meetings on or before this ISO date"),
    sort: str = Query("recent", description="Sort order: 'recent' or 'oldest'"),
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
    db: Session = Depends(get_db),
):
    items, total = meeting_service.list_meetings(
        db=db,
        search=search,
        participant=participant,
        date_from=date_from,
        date_to=date_to,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{meeting_id}", response_model=MeetingDetail)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
):
    return meeting_service.get_meeting(db, meeting_id)


@router.post("", response_model=MeetingDetail, status_code=status.HTTP_201_CREATED)
def create_meeting(
    data: MeetingCreate,
    db: Session = Depends(get_db),
):
    return meeting_service.create_meeting(db, data)


@router.patch("/{meeting_id}", response_model=MeetingDetail)
def update_meeting(
    meeting_id: int,
    data: MeetingUpdate,
    db: Session = Depends(get_db),
):
    return meeting_service.update_meeting(db, meeting_id, data)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
):
    meeting_service.delete_meeting(db, meeting_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
