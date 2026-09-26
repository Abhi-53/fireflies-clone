from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.summary import MeetingSummaryResponse
from app.services import summary_service

router = APIRouter(prefix="/meetings", tags=["summaries"])


@router.get("/{meeting_id}/summary", response_model=MeetingSummaryResponse)
def get_summary(
    meeting_id: int,
    db: Session = Depends(get_db),
):
    return summary_service.get_summary(db, meeting_id)


@router.post("/{meeting_id}/summary/regenerate", response_model=MeetingSummaryResponse)
def regenerate_summary(
    meeting_id: int,
    db: Session = Depends(get_db),
):
    return summary_service.regenerate_summary(db, meeting_id)
