import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_list_meetings_empty(client: TestClient):
    response = client.get("/api/v1/meetings")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_create_and_get_meeting(client: TestClient):
    payload = {
        "title": "Sprint Retrospective & Kickoff",
        "meeting_date": "2026-09-26T10:00:00Z",
        "participants": ["Alice Smith", "Bob Jones"],
        "media_url": "/sample-media/sample-meeting-audio.mp3",
    }
    create_res = client.post("/api/v1/meetings", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["title"] == payload["title"]
    assert len(created["participants"]) == 2
    meeting_id = created["id"]

    # Get by ID
    get_res = client.get(f"/api/v1/meetings/{meeting_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == meeting_id


def test_get_nonexistent_meeting(client: TestClient):
    response = client.get("/api/v1/meetings/999999")
    assert response.status_code == 404
    error_body = response.json()
    assert "error" in error_body
    assert error_body["error"]["code"] == "MEETING_NOT_FOUND"


def test_update_meeting(client: TestClient):
    # Create meeting
    create_res = client.post(
        "/api/v1/meetings",
        json={
            "title": "Original Title",
            "meeting_date": "2026-09-20T12:00:00Z",
            "participants": ["Alice Smith"],
        }
    )
    meeting_id = create_res.json()["id"]

    # Patch title
    patch_res = client.patch(
        f"/api/v1/meetings/{meeting_id}",
        json={"title": "Updated Title", "participants": ["Alice Smith", "Charlie Brown"]}
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["title"] == "Updated Title"
    assert len(updated["participants"]) == 2


def test_delete_meeting(client: TestClient):
    # Create meeting
    create_res = client.post(
        "/api/v1/meetings",
        json={
            "title": "Temporary Meeting",
            "meeting_date": "2026-09-20T12:00:00Z",
            "participants": ["Alice Smith"],
        }
    )
    meeting_id = create_res.json()["id"]

    # Delete
    del_res = client.delete(f"/api/v1/meetings/{meeting_id}")
    assert del_res.status_code == 204

    # Verify 404
    get_res = client.get(f"/api/v1/meetings/{meeting_id}")
    assert get_res.status_code == 404


def test_meeting_filtering_and_sorting(client: TestClient):
    # Create two meetings with different dates and participants
    client.post(
        "/api/v1/meetings",
        json={
            "title": "Alpha Project Sync",
            "meeting_date": "2026-09-01T10:00:00Z",
            "participants": ["Developer One"],
        }
    )
    client.post(
        "/api/v1/meetings",
        json={
            "title": "Beta Launch Review",
            "meeting_date": "2026-09-15T15:00:00Z",
            "participants": ["Manager Two"],
        }
    )

    # Search filter
    res = client.get("/api/v1/meetings?search=Alpha")
    assert res.status_code == 200
    assert any(m["title"] == "Alpha Project Sync" for m in res.json()["items"])

    # Participant filter
    res_p = client.get("/api/v1/meetings?participant=Manager")
    assert res_p.status_code == 200
    assert all("Manager Two" in [p["name"] for p in m["participants"]] for m in res_p.json()["items"])

    # Date filter
    res_d = client.get("/api/v1/meetings?date_from=2026-09-10T00:00:00Z")
    assert res_d.status_code == 200
    for m in res_d.json()["items"]:
        assert m["meeting_date"] >= "2026-09-10T00:00:00Z"
