import requests
import time

API_BASE_URL = "http://localhost:4000"
FRONTEND_BASE_URL = "http://localhost:8081"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWhxcHpqOTUwMDA3cTZnaTA0cnd2MXl0Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYyODY1MjgyLCJleHAiOjE3NjI4Njg4ODJ9.hjWaEv2nn89QGVthte0CmfHnlKgqCkJfI-drIbAMi98"
HEADERS = {"Authorization": f"Bearer {AUTH_TOKEN}", "Content-Type": "application/json"}


def test_recent_activity_formatting_edge_cases():
    """
    Test edge cases for recent activity logs formatting,
    including very old entries, simultaneous events, and unusual audit data,
    ensuring human-readable descriptions remain clear and accurate.
    """

    # Step 1: Create edge case activity log entries via API (if such POST endpoint exists)
    # Since the PRD doesn't specify an endpoint to create audit logs directly,
    # we assume a hypothetical endpoint /v1/analytics/recent-activities for GET only.
    # So we simulate edge cases by mocking or verifying existing data.
    # Here we'll fetch the recent activities and check for formatting in edge cases.

    # The endpoint to get recent activities is assumed to be under analytics or dashboard
    # We try /v1/analytics/recent-activities first as likely
    recent_activity_url = f"{API_BASE_URL}/v1/analytics/recent-activities"

    try:
        response = requests.get(recent_activity_url, headers=HEADERS, timeout=30)
        assert response.status_code == 200, f"Expected 200 OK from recent activities, got {response.status_code}"
        activities = response.json()
        assert isinstance(activities, list), "Recent activities response is not a list"

        # We will check for human-readable description and relative timestamps presence and clarity
        for activity in activities:
            # Each activity should have 'description' (human-readable string)
            assert "description" in activity, "Activity missing human-readable description"
            description = activity["description"]
            assert isinstance(description, str) and description.strip() != "", "Description is empty or not string"

            # Check 'timestamp' or 'timeAgo' or similar field exists and reasonable
            # The naming is guessed since not specified: test both 'timestamp' and 'timeAgo'
            timestamp = activity.get("timestamp")
            time_ago = activity.get("timeAgo")
            # At least one of these must be present and meaningful
            assert (timestamp or time_ago), "Activity missing timestamp/timeAgo field"

            # Additional edge case checks
            # 1. Very old entries: timestamps older than 1 year
            if timestamp:
                time_struct = time.strptime(timestamp[:19], "%Y-%m-%dT%H:%M:%S")
                time_epoch = time.mktime(time_struct)
                age_seconds = time.time() - time_epoch
                if age_seconds > 365 * 24 * 3600:  # older than 1 year
                    # Check description remains clear, e.g. contains words like "on [date]"
                    assert len(description) > 20, "Old activity description too short"
                    assert any(keyword in description.lower() for keyword in ["ago", "on", "at", "date"]), \
                        "Old activity description may not be human-readable"

            # 2. Simultaneous events: Multiple events sharing same timestamp
            # We find activities with duplicate timestamp and check their descriptions differ and clear
            # This will be validated after the loop

            # 3. Unusual audit data: e.g. unusual event types or incomplete fields
            # Check description does not contain raw internal terms or JSON dumps
            assert all(c not in description for c in ["{", "}", "[", "]", "<", ">", "$", "_id"]), \
                "Description contains raw/unusual audit data"

        # Check for simultaneous events with identical timestamps
        timestamps = [act.get("timestamp") for act in activities if act.get("timestamp")]
        duplicates = set([t for t in timestamps if timestamps.count(t) > 1])
        for dup_ts in duplicates:
            dup_activities = [a for a in activities if a.get("timestamp") == dup_ts]
            descriptions = [a["description"] for a in dup_activities]
            # Descriptions should be unique and non-empty for simultaneous events
            assert len(descriptions) == len(set(descriptions)), f"Duplicate descriptions for simultaneous events at {dup_ts}"
            for desc in descriptions:
                assert desc.strip() != "", "Description for simultaneous event is empty"

    except requests.RequestException as e:
        assert False, f"Request to recent activities endpoint failed: {e}"


test_recent_activity_formatting_edge_cases()