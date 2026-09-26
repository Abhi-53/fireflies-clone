from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.search import GlobalSearchResponse
from app.services import search_service

router = APIRouter(tags=["search"])


@router.get("/search", response_model=GlobalSearchResponse)
def search_global(
    q: str = Query("", description="Query string to search across meetings, transcripts, and summaries"),
    db: Session = Depends(get_db),
):
    return search_service.global_search(db, q)
