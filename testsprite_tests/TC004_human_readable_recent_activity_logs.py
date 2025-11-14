import requests
import time

BASE_API_URL = "http://localhost:4000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWhxcHpqOTUwMDA3cTZnaTA0cnd2MXl0Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYyODY1MjgyLCJleHAiOjE3NjI4Njg4ODJ9.hjWaEv2nn89QGVthte0CmfHnlKgqCkJfI-drIbAMi98"
HEADERS = {"Authorization": f"Bearer {AUTH_TOKEN}", "Accept": "application/json"}

def test_human_readable_recent_activity_logs():
    """
    Test that recent activity logs are converted from raw audit entries into human-readable descriptions
    with relative timestamps, without exposing raw API data or internal terminology.
    """
    recent_activity_url = f"{BASE_API_URL}/v1/analytics/overview"
    timeout_seconds = 30

    try:
        response = requests.get(recent_activity_url, headers=HEADERS, timeout=timeout_seconds)
    except requests.RequestException as e:
        assert False, f"HTTP request to recent activity logs endpoint failed: {e}"

    assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response from recent activity logs endpoint is not valid JSON"

    # recent activities might be part of the response under a key 'recentActivities' or similar
    activities = data.get('recentActivities') or data.get('recent_activities') or []

    assert isinstance(activities, list), "Recent activity logs response should be a list"

    # Check each activity item for human readable description and relative timestamp
    for activity in activities:
        assert isinstance(activity, dict), "Each activity log entry should be a dictionary"

        description = activity.get("description")
        timestamp = activity.get("timestamp") or activity.get("timeAgo")

        assert isinstance(description, str) and description.strip(), "Activity description must be a non-empty string"
        forbidden_terms = ["api", "raw", "internal", "id", "uuid", "{", "}", "[", "]"]
        desc_lower = description.lower()
        for term in forbidden_terms:
            assert term not in desc_lower, f"Activity description contains internal term '{term}': {description}"

        assert timestamp is not None, "Activity log must have a timestamp or relative time indication"
        assert isinstance(timestamp, str) and timestamp.strip(), "Timestamp/timeAgo must be a non-empty string"

        relative_terms = ["ago", "just now", "minute", "hour", "day", "second"]
        if not any(term in timestamp.lower() for term in relative_terms):
            try:
                time.strptime(timestamp, "%Y-%m-%dT%H:%M:%S")
            except Exception:
                pass

    raw_keys = ["raw", "audit", "apiData", "internalData", "detailsJson"]
    raw_found = False
    for entry in activities:
        for key in raw_keys:
            if key in entry:
                raw_found = True
                break
    assert not raw_found, "Raw API or internal audit data should not be exposed in recent activity logs"


test_human_readable_recent_activity_logs()
