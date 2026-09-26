from app.routers.meetings import router as meetings_router
from app.routers.transcripts import router as transcripts_router
from app.routers.summaries import router as summaries_router
from app.routers.action_items import router as action_items_router
from app.routers.search import router as search_router

__all__ = [
    "meetings_router",
    "transcripts_router",
    "summaries_router",
    "action_items_router",
    "search_router",
]
