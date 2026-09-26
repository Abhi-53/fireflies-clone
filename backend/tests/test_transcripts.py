import pytest
from fastapi.testclient import TestClient


def test_transcript_upload_and_search(client: TestClient):
    m_res = client.post(
        "/api/v1/meetings",
        json={
            "title": "Transcript Test Meeting",
            "meeting_date": "2026-09-26T15:00:00Z",
            "participants": ["Sarah", "Alex"],
        }
    )
    meeting_id = m_res.json()["id"]

    raw_text = (
        "[00:00:05] Sarah: Welcome to our architecture review.\n"
        "[00:00:20] Alex: Glad to be here. We are testing the transcript parser.\n"
        "[00:00:45] Sarah: Notice how speaker colors and sequence indexes are maintained.\n"
    )

    upload_res = client.post(
        f"/api/v1/meetings/{meeting_id}/transcript",
        json={"raw_text": raw_text}
    )
    assert upload_res.status_code == 201
    data = upload_res.json()
    assert len(data["segments"]) == 3
    assert len(data["speakers"]) == 2
    assert data["segments"][0]["speaker_name"] == "Sarah"

    # Search in transcript
    search_res = client.get(f"/api/v1/meetings/{meeting_id}/transcript/search?q=testing")
    assert search_res.status_code == 200
    matches = search_res.json()["matches"]
    assert len(matches) == 1
    assert matches[0]["speaker_name"] == "Alex"

    # Export meeting
    export_res = client.get(f"/api/v1/meetings/{meeting_id}/export?format=md")
    assert export_res.status_code == 200
    assert "Transcript Test Meeting" in export_res.text
    assert "architecture review" in export_res.text


def test_summary_and_regenerate(client: TestClient):
    m_res = client.post(
        "/api/v1/meetings",
        json={
            "title": "Summary Test Meeting",
            "meeting_date": "2026-09-26T16:00:00Z",
            "participants": ["Elena", "Dev"],
        }
    )
    meeting_id = m_res.json()["id"]

    # Upload transcript first
    raw_text = (
        "[00:00:10] Elena: First let's review the design system tokens and component layout.\n"
        "[00:01:00] Dev: I have implemented the button and modal components following the spec.\n"
        "[00:02:30] Elena: Great, let's also plan the next sprint items for the dashboard.\n"
    )
    client.post(
        f"/api/v1/meetings/{meeting_id}/transcript",
        json={"raw_text": raw_text}
    )

    # Regenerate summary
    regen_res = client.post(f"/api/v1/meetings/{meeting_id}/summary/regenerate")
    assert regen_res.status_code == 200
    summary_data = regen_res.json()
    assert summary_data["summary"] is not None
    assert len(summary_data["topics"]) > 0

    # Get summary
    get_res = client.get(f"/api/v1/meetings/{meeting_id}/summary")
    assert get_res.status_code == 200
    assert get_res.json()["summary"]["overview_text"] == summary_data["summary"]["overview_text"]
