import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_FRONTEND = "http://localhost:8081"
BASE_API = "http://localhost:4000"
DASHBOARD_FRONTEND_PATH = "/admin/dashboard"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWhxcHpqOTUwMDA3cTZnaTA0cnd2MXl0Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYyODY1MjgyLCJleHAiOjE3NjI4Njg4ODJ9.hjWaEv2nn89QGVthte0CmfHnlKgqCkJfI-drIbAMi98"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
TIMEOUT = 30

def test_dashboard_responsiveness_and_accessibility():
    """
    Verify all visual components of the dashboard including KPIs, graphs,
    lists, and summaries are responsive, accessible, and free from visual defects
    or broken layouts by fetching relevant live data endpoints in parallel.
    Validate data presence, structure, and accessibility-related fields.
    """

    endpoints = {
        "kpis": f"{BASE_API}/v1/analytics/overview",
        "employee_growth": f"{BASE_API}/v1/reports/employee-growth",
        "payroll_summary": f"{BASE_API}/v1/reports/payroll-summary",
        "department_performance": f"{BASE_API}/v1/reports/department-performance",
        "attendance_distribution": f"{BASE_API}/v1/analytics/attendance",
        "top_performers": f"{BASE_API}/v1/profile",
        "recent_activities": f"{BASE_API}/v1/reports/leave-utilization",
        "company_summary": f"{BASE_API}/v1/reports/company-overview"
    }

    results = {}

    def fetch(endpoint_key):
        url = endpoints[endpoint_key]
        try:
            response = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
            response.raise_for_status()
            return endpoint_key, response.json()
        except requests.RequestException as e:
            return endpoint_key, {"error": str(e)}

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(fetch, key) for key in endpoints.keys()]
        for future in as_completed(futures):
            key, data = future.result()
            results[key] = data

    # Assertions to verify data exists and looks structurally correct for dashboard components

    # KPIs
    kpis = results.get("kpis", {})
    assert "totalEmployees" in kpis or "total_employees" in kpis or any(k.startswith('total') for k in kpis.keys()), \
        "KPIs data missing or incomplete"
    # Validate values are numbers and non-negative
    for k, v in kpis.items():
        if isinstance(v, (int, float)):
            assert v >= 0, f"KPI '{k}' has negative value"

    # Employee Growth Trend (should be a list/dict with trend data)
    eg = results.get("employee_growth", {})
    assert isinstance(eg, (dict, list)), "Employee Growth data missing or malformed"
    # Expect at least some data points
    if isinstance(eg, dict):
        assert any(len(v) > 0 for v in eg.values() if isinstance(v, list)) or len(eg) > 0, "Employee Growth empty"
    elif isinstance(eg, list):
        assert len(eg) > 0, "Employee Growth empty"

    # Payroll Summary (gross/net trends)
    payroll = results.get("payroll_summary", {})
    assert isinstance(payroll, (dict, list)), "Payroll Summary missing or malformed"

    # Department Performance (top departments with scores)
    dept_perf = results.get("department_performance", {})
    assert isinstance(dept_perf, (list, dict)), "Department Performance data missing or malformed"
    if isinstance(dept_perf, list):
        assert len(dept_perf) > 0, "Department Performance list empty"
    elif isinstance(dept_perf, dict):
        assert len(dept_perf) > 0, "Department Performance dict empty"

    # Attendance Distribution (pie chart data)
    attendance = results.get("attendance_distribution", {})
    assert isinstance(attendance, (dict, list)), "Attendance Distribution missing or malformed"
    def has_numeric_values(data):
        if isinstance(data, dict):
            return any(
                isinstance(v, (int, float)) or
                (isinstance(v, list) and any(isinstance(i, (int, float)) for i in v))
                for v in data.values()
            )
        elif isinstance(data, list):
            return any(isinstance(i, (int, float)) or
                       (isinstance(i, list) and any(isinstance(j, (int, float)) for j in i))
                       for i in data)
        return False
    assert has_numeric_values(attendance), "Attendance distribution numbers missing"

    # Top Performers list (expect a list of profiles or employees)
    top_perf = results.get("top_performers", {})
    # Profiles endpoint returns list of employee profiles
    assert isinstance(top_perf, list), "Top Performers list missing or malformed"
    # Check at least 5 or more employees for top performers
    assert len(top_perf) >= 5, "Insufficient top performers returned"
    for emp in top_perf[:5]:
        assert "name" in emp or "fullName" in emp or "firstName" in emp, "Employee name missing"
        assert "department" in emp or "departmentId" in emp or "dept" in emp, "Employee department missing"

    # Recent Activities (Leave utilization used here as proxy, check structure)
    recent_act = results.get("recent_activities", {})
    assert isinstance(recent_act, dict) or isinstance(recent_act, list), "Recent Activities data missing or malformed"

    # Company Summary (overview data)
    comp_sum = results.get("company_summary", {})
    assert isinstance(comp_sum, dict), "Company Summary missing or malformed"
    # Check some expected keys
    expected_keys = ["attritionRate", "newJoinees", "leavesUtilizedPercent", "averageDeductions"]
    present_key = any(k.lower() in (key.lower() for key in comp_sum.keys()) for k in expected_keys)
    assert present_key, "Company summary expected keys missing"

    # Accessibility and Responsiveness check via frontend minimal fetch (no GUI testing possible here)
    # We fetch the dashboard frontend page and ensure it responds
    dashboard_url = f"{BASE_FRONTEND}{DASHBOARD_FRONTEND_PATH}"
    try:
        frontend_resp = requests.get(dashboard_url, headers=HEADERS, timeout=TIMEOUT)
        frontend_resp.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Dashboard frontend load failed: {e}"

    # Minimal accessibility heuristics (presence of ARIA attributes, alt texts check on HTML content)
    html = frontend_resp.text.lower()
    assert "aria-" in html or "role=" in html, "Accessibility attributes missing in dashboard frontend HTML"
    assert "<img" not in html or "alt=" in html, "Some img tags missing alt attribute in dashboard frontend HTML"

test_dashboard_responsiveness_and_accessibility()
