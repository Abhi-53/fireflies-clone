import pytest
from fastapi.testclient import TestClient


def test_global_search(client: TestClient):
    # Create meeting with distinct text
    m_res = client.post(
        "/api/v1/meetings",
        json={
            "title": "Quarterly Financial Analysis",
            "meeting_date": "2026-09-26T17:00:00Z",
            "participants": ["David Kim"],
        }
    )
    meeting_id = m_res.json()["id"]

    # Upload transcript with distinct keywords
    client.post(
        f"/api/v1/meetings/{meeting_id}/transcript",
        json={"raw_text": "[00:00:10] David Kim: Profitability increased significantly in enterprise accounts."}
    )

    # Search for "Profitability"
    search_res = client.get("/api/v1/search?q=Profitability")
    assert search_res.status_code == 200
    data = search_res.json()
    assert data["query"] == "Profitability"
    assert len(data["transcripts"]) >= 1
    assert data["transcripts"][0]["meeting_id"] == meeting_id

    # Search for "Financial"
    search_res_title = client.get("/api/v1/search?q=Financial")
    assert search_res_title.status_code == 200
    data_title = search_res_title.json()
    assert any(m["id"] == meeting_id for m in data_title["meetings"])
