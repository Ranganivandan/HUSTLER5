import requests

def test_company_summary_metrics_accuracy():
    api_base_url = "http://localhost:4000"
    dashboard_frontend_url = "http://localhost:8081"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWhxcHpqOTUwMDA3cTZnaTA0cnd2MXl0Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYyODY1MjgyLCJleHAiOjE3NjI4Njg4ODJ9.hjWaEv2nn89QGVthte0CmfHnlKgqCkJfI-drIbAMi98"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    timeout = 30

    # Endpoint for company summary metrics (based on PRD and test case description, using reports endpoint)
    summary_metrics_url = f"{api_base_url}/v1/reports/company-overview"

    try:
        response = requests.get(summary_metrics_url, headers=headers, timeout=timeout)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        data = response.json()

        # Basic assertions for the required metrics presence and type validation
        assert isinstance(data, dict), "Response JSON is not a dictionary"

        # Check required keys exist
        required_keys = ["attritionRate", "newJoineesCount", "leavesUtilizedPercentage", "averageDeductions", "textualSummary"]
        for key in required_keys:
            assert key in data, f"Missing key '{key}' in company summary metrics response"

        # Validate attritionRate is a float and between 0 and 100 (percentage)
        attrition_rate = data["attritionRate"]
        assert isinstance(attrition_rate, (float, int)), "attritionRate should be a number"
        assert 0 <= attrition_rate <= 100, "attritionRate should be between 0 and 100"

        # Validate newJoineesCount is a non-negative integer
        new_joinees_count = data["newJoineesCount"]
        assert isinstance(new_joinees_count, int), "newJoineesCount should be an integer"
        assert new_joinees_count >= 0, "newJoineesCount should be non-negative"

        # Validate leavesUtilizedPercentage is a float between 0 and 100
        leaves_utilized_percentage = data["leavesUtilizedPercentage"]
        assert isinstance(leaves_utilized_percentage, (float, int)), "leavesUtilizedPercentage should be a number"
        assert 0 <= leaves_utilized_percentage <= 100, "leavesUtilizedPercentage should be between 0 and 100"

        # Validate averageDeductions is a float and non-negative
        average_deductions = data["averageDeductions"]
        assert isinstance(average_deductions, (float, int)), "averageDeductions should be a number"
        assert average_deductions >= 0, "averageDeductions should be non-negative"

        # Validate textual summary is a non-empty string
        textual_summary = data["textualSummary"]
        assert isinstance(textual_summary, str), "textualSummary should be a string"
        assert len(textual_summary.strip()) > 0, "textualSummary should not be empty"

        # Additional coherence and factual check (basic)
        # The textual summary should mention attrition rate, new joinees count, leaves utilized, or deductions in some form
        summary_lower = textual_summary.lower()
        keywords = ["attrition", "new joinees", "leaves", "deductions"]
        assert any(keyword in summary_lower for keyword in keywords), "textualSummary does not mention expected metrics keywords"

    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_company_summary_metrics_accuracy()