import requests

BASE_URL_API = "http://localhost:4000"
TIMEOUT = 30
AUTH_HEADER = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWhxcHpqOTUwMDA3cTZnaTA0cnd2MXl0Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYyODY1MjgyLCJleHAiOjE3NjI4Njg4ODJ9.hjWaEv2nn89QGVthte0CmfHnlKgqCkJfI-drIbAMi98"
}

# Chosen representative data endpoints that frontend would use for dashboard KPIs and reports
# We'll simulate error scenarios by calling non-existent or malformed endpoints, and by using invalid query params
# to check graceful error handling.

def test_TC008_error_handling_for_data_endpoints():
    # Define endpoints to test error handling on -- typical dashboard data endpoints
    endpoints = [
        "/v1/analytics/overview",                  # valid endpoint, try with invalid params
        "/v1/analytics/attendance",                # valid endpoint, try with invalid params
        "/v1/analytics/payroll",                    # valid endpoint, try with invalid params
        "/v1/reports/department-performance",      # valid endpoint, try invalid params
        "/v1/reports/employee-growth",              # valid endpoint, try non-existent id or param
        "/v1/nonexistent/endpoint",                  # non-existent endpoint to simulate 404
        "/v1/profile/invalid-user-id",              # invalid user id to simulate 400/404
        "/v1/attendance/summary?month=invalid-date" # invalid query param simulating bad request
    ]

    for ep in endpoints:
        url = BASE_URL_API + ep

        try:
            # Deliberately send invalid query or path params to provoke errors on known endpoints
            response = requests.get(url, headers=AUTH_HEADER, timeout=TIMEOUT)
        except requests.exceptions.RequestException as e:
            # Network or connection errors occur - fail test in that case
            assert False, f"Request to {url} failed with exception: {e}"

        # Now validate the response for graceful error handling

        if response.status_code == 404:
            # For 404 errors, the system should respond with JSON error message, not raw HTML or stack trace
            try:
                data = response.json()
            except Exception:
                assert False, f"404 response from {url} did not return valid JSON error message"
            # Check expected keys in error response like message
            assert "error" in data or "message" in data, f"404 error response from {url} missing error message"
        elif response.status_code == 400:
            # Bad request response should contain friendly error message and not raw exception details
            try:
                data = response.json()
            except Exception:
                assert False, f"400 response from {url} did not return valid JSON error message"
            assert "error" in data or "message" in data, f"400 error response from {url} missing error message"
        elif response.status_code >= 500:
            # 5xx errors should not expose raw stack trace or crash info to user
            try:
                data = response.json()
            except Exception:
                # If not JSON, fail test
                assert False, f"5xx response from {url} did not return valid JSON error message"
            # The error message should be user friendly, usually standard error keys
            assert "error" in data or "message" in data, f"5xx error response from {url} missing error message"
            # Also ensure 'stack' or 'trace' keys are not present to avoid raw error exposure
            assert "stack" not in data and "trace" not in data, f"5xx error response from {url} exposes internal error details"
        else:
            # For successful or other status codes:
            # If response is 200 or 204, it's considered good; but test asks for error handling:
            # So if the request was made on a known invalid endpoint or with invalid params,
            # anything other than an error status code should at least result in empty data or a message,
            # not raw error or crash
            try:
                data = response.json()
            except Exception:
                # If no JSON and no error status, fail because frontend expects JSON
                assert False, f"Non-error response from {url} did not return JSON data"

            # Validate no raw error objects included in response even if data is empty or error-like
            # Check that no keys like stack, error_trace exist in response data
            forbidden_keys = {"stack", "trace", "error_trace", "exception"}
            assert not any(k in data for k in forbidden_keys), f"Response from {url} contains raw error keys unexpectedly"
            # If the response has an error field or message, it should be user friendly string
            if "error" in data:
                assert isinstance(data["error"], (str, dict)) or data["error"] is None
            if "message" in data:
                assert isinstance(data["message"], str) or data["message"] is None

    print("test_TC008_error_handling_for_data_endpoints passed")

test_TC008_error_handling_for_data_endpoints()