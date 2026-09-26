import pytest
from fastapi.testclient import TestClient


def test_action_item_lifecycle(client: TestClient):
    # Create meeting
    m_res = client.post(
        "/api/v1/meetings",
        json={
            "title": "Action Items Test Meeting",
            "meeting_date": "2026-09-26T14:00:00Z",
            "participants": ["Alice Smith"],
        }
    )
    meeting_id = m_res.json()["id"]

    # 1. Create action item
    ai_payload = {
        "text": "Review architecture blueprint carefully",
        "assignee": "Alice Smith",
        "due_date": "2026-09-30",
    }
    create_res = client.post(f"/api/v1/meetings/{meeting_id}/action-items", json=ai_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    item_id = created["id"]
    assert created["text"] == ai_payload["text"]
    assert created["assignee"] == "Alice Smith"
    assert created["is_completed"] is False

    # 2. List action items
    list_res = client.get(f"/api/v1/meetings/{meeting_id}/action-items")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Toggle complete
    complete_res = client.patch(f"/api/v1/action-items/{item_id}/complete", json={"is_completed": True})
    assert complete_res.status_code == 200
    assert complete_res.json()["is_completed"] is True

    # 4. Edit action item
    edit_res = client.patch(f"/api/v1/action-items/{item_id}", json={"text": "Updated text for action item"})
    assert edit_res.status_code == 200
    assert edit_res.json()["text"] == "Updated text for action item"

    # 5. Delete action item
    del_res = client.delete(f"/api/v1/action-items/{item_id}")
    assert del_res.status_code == 204

    # 6. Verify deleted
    verify_res = client.patch(f"/api/v1/action-items/{item_id}/complete", json={"is_completed": False})
    assert verify_res.status_code == 404
