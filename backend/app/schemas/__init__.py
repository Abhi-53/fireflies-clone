from app.schemas.common import ErrorDetail, ErrorResponse
from app.schemas.participant import ParticipantBase, ParticipantCreate, ParticipantResponse
from app.schemas.meeting import (
    MeetingBase,
    MeetingCreate,
    MeetingUpdate,
    MeetingListItem,
    MeetingDetail,
    MeetingListResponse,
)
from app.schemas.transcript import (
    SpeakerResponse,
    TranscriptSegmentResponse,
    TranscriptResponse,
    TranscriptUpload,
    TranscriptSearchMatch,
    TranscriptSearchResponse,
)
from app.schemas.summary import (
    TopicResponse,
    SummaryResponse,
    MeetingSummaryResponse,
)
from app.schemas.action_item import (
    ActionItemCreate,
    ActionItemUpdate,
    ActionItemComplete,
    ActionItemResponse,
)
from app.schemas.search import (
    SearchResultMeeting,
    SearchResultTranscript,
    SearchResultSummary,
    GlobalSearchResponse,
)

__all__ = [
    "ErrorDetail",
    "ErrorResponse",
    "ParticipantBase",
    "ParticipantCreate",
    "ParticipantResponse",
    "MeetingBase",
    "MeetingCreate",
    "MeetingUpdate",
    "MeetingListItem",
    "MeetingDetail",
    "MeetingListResponse",
    "SpeakerResponse",
    "TranscriptSegmentResponse",
    "TranscriptResponse",
    "TranscriptUpload",
    "TranscriptSearchMatch",
    "TranscriptSearchResponse",
    "TopicResponse",
    "SummaryResponse",
    "MeetingSummaryResponse",
    "ActionItemCreate",
    "ActionItemUpdate",
    "ActionItemComplete",
    "ActionItemResponse",
    "SearchResultMeeting",
    "SearchResultTranscript",
    "SearchResultSummary",
    "GlobalSearchResponse",
]
