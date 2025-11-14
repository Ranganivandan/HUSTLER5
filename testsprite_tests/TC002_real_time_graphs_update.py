import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_API_URL = "http://localhost:4000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWhxcHpqOTUwMDA3cTZnaTA0cnd2MXl0Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYyODY1MjgyLCJleHAiOjE3NjI4Njg4ODJ9.hjWaEv2nn89QGVthte0CmfHnlKgqCkJfI-drIbAMi98"
HEADERS = {'Authorization': f'Bearer {AUTH_TOKEN}'}
TIMEOUT = 30

def test_real_time_graphs_update():
    """
    Test that all four dynamic graphs update correctly with live data,
    showing accurate trends, segmented information, legends, and labels.
    """

    # Define the API endpoints needed for the graphs
    endpoints = {
        "employee_growth": "/v1/reports/employee-growth",
        "payroll_summary": "/v1/reports/payroll-summary",
        "department_performance": "/v1/reports/department-performance",
        "attendance_analytics": "/v1/reports/attendance-analytics"
    }

    # Fetch all graph data in parallel to simulate real-time dashboard calls
    results = {}
    with ThreadPoolExecutor(max_workers=4) as executor:
        future_to_key = {
            executor.submit(
                requests.get,
                BASE_API_URL + path,
                headers=HEADERS,
                timeout=TIMEOUT
            ): key for key, path in endpoints.items()
        }
        for future in as_completed(future_to_key):
            key = future_to_key[future]
            try:
                response = future.result()
            except requests.RequestException as e:
                assert False, f"Request for {key} failed: {str(e)}"
            results[key] = response

    # Validate each graph response
    # Employee Growth Trend (last 6 months)
    eg_resp = results["employee_growth"]
    assert eg_resp.status_code == 200, f"Employee Growth Trend API returned {eg_resp.status_code}"
    eg_data_raw = eg_resp.json()

    # Fix extraction of employee growth data
    if isinstance(eg_data_raw, dict):
        # If dict has exactly one key and corresponding value is a list, use it
        keys = list(eg_data_raw.keys())
        if len(keys) == 1 and isinstance(eg_data_raw[keys[0]], list):
            eg_data = eg_data_raw[keys[0]]
        else:
            # Try known keys
            possible_keys = ['data', 'employeeGrowth', 'results']
            eg_data = None
            for k in possible_keys:
                if k in eg_data_raw and isinstance(eg_data_raw[k], list):
                    eg_data = eg_data_raw[k]
                    break
            if eg_data is None:
                assert False, "Employee growth data not found in response dict"
    else:
        eg_data = eg_data_raw

    assert isinstance(eg_data, list), "Employee growth data must be a list"
    assert len(eg_data) == 6, "Employee growth trend should have exactly 6 months data"
    for point in eg_data:
        assert "month" in point and isinstance(point["month"], str), "Each data point must have 'month' string"
        assert "employeeCount" in point and isinstance(point["employeeCount"], (int, float)), "'employeeCount' must be a number"

    # Payroll Cost Trend (gross and net over last 6 months)
    ps_resp = results["payroll_summary"]
    assert ps_resp.status_code == 200, f"Payroll Summary API returned {ps_resp.status_code}"
    ps_data = ps_resp.json()
    # Expecting keys like: grossTotals and netTotals each as list of 6 months with 'month' and 'amount'
    assert isinstance(ps_data, dict), "Payroll summary data must be a dict"
    assert "grossTotals" in ps_data and "netTotals" in ps_data, "Payroll summary must include grossTotals and netTotals"
    gross = ps_data["grossTotals"]
    net = ps_data["netTotals"]
    assert len(gross) == 6 and len(net) == 6, "Payroll trend should have 6 months data for gross and net"
    for g_point, n_point in zip(gross, net):
        assert "month" in g_point and isinstance(g_point["month"], str), "Each gross data point must have 'month' string"
        assert "amount" in g_point and isinstance(g_point["amount"], (int, float)), "Gross amount must be a number"
        assert "month" in n_point and g_point["month"] == n_point["month"], "Months must match in gross and net"
        assert "amount" in n_point and isinstance(n_point["amount"], (int, float)), "Net amount must be a number"

    # Department Performance (top 5 departments by score)
    dp_resp = results["department_performance"]
    assert dp_resp.status_code == 200, f"Department Performance API returned {dp_resp.status_code}"
    dp_data = dp_resp.json()
    # Expecting a list of departments, each with 'departmentName' and 'score'
    assert isinstance(dp_data, list), "Department performance data must be a list"
    assert 1 <= len(dp_data) <= 5, "Department performance should have up to 5 departments"
    for dept in dp_data:
        assert "departmentName" in dept and isinstance(dept["departmentName"], str), "Each department must have a name string"
        assert "score" in dept and isinstance(dept["score"], (int, float)), "Each department must have a numeric score"

    # Attendance Distribution (pie chart of attendance status)
    ad_resp = results["attendance_analytics"]
    assert ad_resp.status_code == 200, f"Attendance Analytics API returned {ad_resp.status_code}"
    ad_data = ad_resp.json()
    # Expecting a dict or list with attendance statuses and counts/percentages
    # Accept dictionary with keys as statuses and values as counts (ints)
    assert isinstance(ad_data, dict) or isinstance(ad_data, list), "Attendance data must be dict or list"
    if isinstance(ad_data, dict):
        assert len(ad_data) > 0, "Attendance distribution data must not be empty"
        for status, count in ad_data.items():
            assert isinstance(status, str) and status.strip() != "", "Attendance status must be a non-empty string"
            assert isinstance(count, int) and count >= 0, "Attendance counts must be non-negative integers"
    elif isinstance(ad_data, list):
        # List of objects with keys: status and count
        assert len(ad_data) > 0, "Attendance distribution data must not be empty"
        for entry in ad_data:
            assert "status" in entry and isinstance(entry["status"], str) and entry["status"].strip() != "", "Each attendance entry must have a status"
            assert "count" in entry and isinstance(entry["count"], int) and entry["count"] >= 0, "Each attendance count must be a non-negative int"

    # Additional validation for legends, labels, trends could be part of UI tests,
    # here we assert presence and correctness of keys/data for domain relevance.

test_real_time_graphs_update()
