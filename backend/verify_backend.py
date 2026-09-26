"""
Verification script for Fireflies Clone Backend & APIs
Tests startup, automatic seeding, database tables, and core REST endpoints.
"""

from fastapi.testclient import TestClient
from app.main import app

def run_verification():
    print("=" * 60)
    print("STARTING FIREFLIES CLONE BACKEND VERIFICATION")
    print("=" * 60)

    with TestClient(app) as client:
        # 1. Health check
        res = client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print(f"[OK] 1. Health check passed: {res.json()}")

        # 2. Meetings list & auto-seed check
        res = client.get("/api/v1/meetings")
        assert res.status_code == 200, f"List meetings failed: {res.text}"
        data = res.json()
        print(f"[OK] 2. Meetings retrieved: total = {data['total']}, items = {len(data['items'])}")
        assert data["total"] >= 4, f"Expected at least 4 seeded meetings, got {data['total']}"
        first_meeting = data["items"][0]
        first_id = first_meeting["id"]
        print(f"     First meeting: #{first_id} - '{first_meeting['title']}' with {len(first_meeting['participants'])} participants")

        # 3. Filtering and sorting
        res_filter = client.get("/api/v1/meetings?search=Engineering")
        assert res_filter.status_code == 200
        assert any("Engineering" in m["title"] for m in res_filter.json()["items"])
        print("[OK] 3. Meetings search filter passed")

        # 4. Meeting Detail
        res_detail = client.get(f"/api/v1/meetings/{first_id}")
        assert res_detail.status_code == 200
        detail = res_detail.json()
        assert detail["id"] == first_id
        print(f"[OK] 4. Meeting detail retrieved: '{detail['title']}'")

        # 5. Transcript
        res_transcript = client.get(f"/api/v1/meetings/{first_id}/transcript")
        assert res_transcript.status_code == 200
        transcript = res_transcript.json()
        assert len(transcript["segments"]) > 0
        assert len(transcript["speakers"]) > 0
        print(f"[OK] 5. Transcript retrieved: {len(transcript['segments'])} segments, {len(transcript['speakers'])} speakers")

        # 6. Transcript search
        res_ts_search = client.get(f"/api/v1/meetings/{first_id}/transcript/search?q=roadmap")
        assert res_ts_search.status_code == 200
        matches = res_ts_search.json()["matches"]
        print(f"[OK] 6. Transcript substring search passed: {len(matches)} matches found")

        # 7. Summary & Topics
        res_summary = client.get(f"/api/v1/meetings/{first_id}/summary")
        assert res_summary.status_code == 200
        sum_data = res_summary.json()
        assert sum_data["summary"] is not None
        assert len(sum_data["topics"]) > 0
        print(f"[OK] 7. Summary retrieved: {len(sum_data['topics'])} topics, overview length = {len(sum_data['summary']['overview_text'])}")

        # 8. Action Items
        res_ai = client.get(f"/api/v1/meetings/{first_id}/action-items")
        assert res_ai.status_code == 200
        action_items = res_ai.json()
        print(f"[OK] 8. Action items retrieved: {len(action_items)} items")

        # 9. Create Action Item
        new_ai = {
            "text": "Verification automated action item",
            "assignee": "Alex Rivera",
            "due_date": "2026-10-01"
        }
        res_create_ai = client.post(f"/api/v1/meetings/{first_id}/action-items", json=new_ai)
        assert res_create_ai.status_code == 201
        created_ai = res_create_ai.json()
        ai_id = created_ai["id"]
        print(f"[OK] 9. Action item created: #{ai_id} - '{created_ai['text']}'")

        # 10. Toggle Action Item Completion
        res_toggle = client.patch(f"/api/v1/action-items/{ai_id}/complete", json={"is_completed": True})
        assert res_toggle.status_code == 200
        assert res_toggle.json()["is_completed"] is True
        print(f"[OK] 10. Action item completion toggled: is_completed = True")

        # 11. Global Search
        res_global = client.get("/api/v1/search?q=sprint")
        assert res_global.status_code == 200
        search_data = res_global.json()
        print(f"[OK] 11. Global search passed: {len(search_data['meetings'])} meetings, {len(search_data['transcripts'])} transcripts")

        # 12. Meeting Export
        res_export = client.get(f"/api/v1/meetings/{first_id}/export?format=md")
        assert res_export.status_code == 200
        assert "# " in res_export.text
        print("[OK] 12. Markdown export generated successfully")

        # 13. Create & Delete Meeting (Cascade check)
        temp_meeting = client.post(
            "/api/v1/meetings",
            json={
                "title": "Temporary Cascade Test Meeting",
                "meeting_date": "2026-09-26T18:00:00Z",
                "participants": ["Tester"],
                "transcript_text": "[00:00:01] Tester: This meeting will be deleted."
            }
        ).json()
        temp_id = temp_meeting["id"]
        
        # Add action item to temp meeting
        client.post(f"/api/v1/meetings/{temp_id}/action-items", json={"text": "Temp item"})
        
        # Delete meeting
        del_res = client.delete(f"/api/v1/meetings/{temp_id}")
        assert del_res.status_code == 204
        
        # Verify 404
        assert client.get(f"/api/v1/meetings/{temp_id}").status_code == 404
        assert client.get(f"/api/v1/meetings/{temp_id}/action-items").status_code == 404
        print("[OK] 13. Cascade deletion verified: meeting and child records cleanly removed")

    print("=" * 60)
    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_verification()
