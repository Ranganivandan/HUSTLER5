import requests
import time
from concurrent.futures import ThreadPoolExecutor

BASE_FRONTEND_URL = "http://localhost:8081"
BASE_API_URL = "http://localhost:4000"
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWhxcHpqOTUwMDA3cTZnaTA0cnd2MXl0Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYyODY1MjgyLCJleHAiOjE3NjI4Njg4ODJ9.hjWaEv2nn89QGVthte0CmfHnlKgqCkJfI-drIbAMi98"

HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Accept": "application/json"
}

# Relevant dashboard data endpoints to test parallel fetching and caching effectiveness
DASHBOARD_ENDPOINTS = [
    "/v1/analytics/overview",
    "/v1/analytics/attendance",
    "/v1/analytics/payroll",
    "/v1/reports/company-overview",
    "/v1/reports/department-performance",
    "/v1/reports/payroll-summary",
    "/v1/reports/leave-utilization",
    "/v1/reports/attendance-analytics",
    "/v1/reports/employee-growth"
]

def fetch_endpoint(session, url):
    try:
        resp = session.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        json_data = resp.json()
        return json_data
    except Exception as e:
        return {"error": str(e)}

def test_performance_optimization_parallel_fetching():
    session = requests.Session()

    # Compose full API URLs
    urls = [BASE_API_URL + ep for ep in DASHBOARD_ENDPOINTS]

    # 1. Measure sequential fetching time
    sequential_start = time.time()
    sequential_results = []
    for url in urls:
        result = fetch_endpoint(session, url)
        sequential_results.append(result)
    sequential_duration = time.time() - sequential_start

    # Basic assertions on sequential results
    for res, endpoint in zip(sequential_results, DASHBOARD_ENDPOINTS):
        # If error in response, fail test
        assert "error" not in res, f"Sequential fetch failed for {endpoint}: {res.get('error')}"
        # Expect dict or list response (basic structural check)
        assert isinstance(res, (dict, list)), f"Unexpected response type for {endpoint}"

    # 2. Measure parallel fetching time
    parallel_start = time.time()
    with ThreadPoolExecutor(max_workers=len(urls)) as executor:
        futures = [executor.submit(fetch_endpoint, session, url) for url in urls]
        parallel_results = [f.result() for f in futures]
    parallel_duration = time.time() - parallel_start

    # Basic assertions on parallel results
    for res, endpoint in zip(parallel_results, DASHBOARD_ENDPOINTS):
        assert "error" not in res, f"Parallel fetch failed for {endpoint}: {res.get('error')}"
        assert isinstance(res, (dict, list)), f"Unexpected response type for {endpoint}"

    # 3. Validate performance: parallel fetching time should be significantly less than sequential
    # Allow some margin; parallel duration should be less than 60% of sequential
    assert parallel_duration < sequential_duration * 0.6, (
        f"Parallel fetching ({parallel_duration:.2f}s) not sufficiently faster than sequential ({sequential_duration:.2f}s)"
    )

    # 4. Basic sanity check on some key fields in the overview API to ensure caching effectiveness isn't causing stale data
    overview_data_seq = sequential_results[0]
    overview_data_par = parallel_results[0]
    # Both results should be equal or very similar (assuming no backend data change between calls)
    assert overview_data_seq == overview_data_par, "Mismatch between sequential and parallel overview data, possible caching issue"

    session.close()

test_performance_optimization_parallel_fetching()
