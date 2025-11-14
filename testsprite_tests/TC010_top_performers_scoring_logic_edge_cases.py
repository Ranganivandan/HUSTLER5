import requests
import time

API_BASE_URL = "http://localhost:4000"
FRONTEND_BASE_URL = "http://localhost:8081"
TIMEOUT = 30
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWhxcHpqOTUwMDA3cTZnaTA0cnd2MXl0Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYyODY1MjgyLCJleHAiOjE3NjI4Njg4ODJ9.hjWaEv2nn89QGVthte0CmfHnlKgqCkJfI-drIbAMi98"

HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}

def test_top_performers_scoring_logic_edge_cases():
    """
    Verify the scoring logic for top performers with edge cases such as employees with identical scores,
    missing salary data, or new hires, ensuring correct sorting and display.
    """
    # Step 1: Create three test users with edge case scenarios:
    #  - Employee A and Employee B: identical scores (similar salary and profile)
    #  - Employee C: missing salary data (simulate by no salary or zero)
    #  - Employee D: new hire with minimal data and salary
    
    created_user_ids = []
    try:
        # Common password for test users
        password = "TestPass123!"
        
        # Users data without salary and hireDate, as they belong to employee profiles
        users_payload = [
            {
                "email": f"employeeA_{int(time.time())}@example.com",
                "password": password,
                "role": "employee",
                "name": "Employee A",
                "department": "Engineering"
            },
            {
                "email": f"employeeB_{int(time.time())}@example.com",
                "password": password,
                "role": "employee",
                "name": "Employee B",
                "department": "Engineering"
            },
            {
                "email": f"employeeC_{int(time.time())}@example.com",
                "password": password,
                "role": "employee",
                "name": "Employee C",
                "department": "Engineering"
            },
            {
                "email": f"employeeD_{int(time.time())}@example.com",
                "password": password,
                "role": "employee",
                "name": "Employee D",
                "department": "Engineering"
            }
        ]

        # Create users via POST /v1/users
        for user_data in users_payload:
            payload = user_data.copy()
            response = requests.post(
                f"{API_BASE_URL}/v1/users",
                headers=HEADERS,
                json=payload,
                timeout=TIMEOUT
            )
            assert response.status_code in (200, 201), \
                f"Failed to create user {user_data['name']} with status {response.status_code} and body {response.text}"
            data = response.json()
            user_id = data.get("id") if isinstance(data, dict) else None
            assert user_id is not None, f"No user ID returned for user {user_data['name']}"
            created_user_ids.append(user_id)

        # Step 2: Wait briefly to ensure backend processes and indexes new users if needed
        time.sleep(2)

        # Step 3: Call the endpoint that returns top performers (Assuming a reporting or dashboard endpoint)
        response = requests.get(
            f"{API_BASE_URL}/v1/profile",
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response.status_code == 200, f"Failed to fetch profiles: {response.status_code} {response.text}"
        employees = response.json()
        assert isinstance(employees, list), "Profiles response should be a list"

        # Filter test users by their IDs to check sorting and scoring
        test_employees = [e for e in employees if e.get("id") in created_user_ids]

        # Check that all created test users are returned
        assert len(test_employees) == len(created_user_ids), "Not all test users returned in profiles"

        # Prepare a list of dicts with user_id, salary (fallback 0), hireDate, name
        performers = []
        for e in test_employees:
            salary = e.get("salary")
            if salary is None:
                salary = 0
            hire_date = e.get("hireDate") or ""
            performers.append({
                "id": e.get("id"),
                "name": e.get("name"),
                "salary": salary,
                "hireDate": hire_date
            })

        # Sort performers by salary descending and hireDate ascending; missing hireDate treated as far future
        sorted_performers = sorted(
            performers,
            key=lambda x: (-x["salary"], x["hireDate"] if x["hireDate"] else "9999-12-31")
        )

        # Map user ids to indexes
        id_to_index = {perf["id"]: idx for idx, perf in enumerate(sorted_performers)}

        idx_a = id_to_index.get(created_user_ids[0])
        idx_b = id_to_index.get(created_user_ids[1])
        idx_c = id_to_index.get(created_user_ids[2])
        idx_d = id_to_index.get(created_user_ids[3])

        # Assert employees A and B have identical scores, A appears before B due to earlier hireDate
        assert idx_a < idx_b, "Employee A should appear before Employee B due to hireDate sorting when scores tied"
        # Employee C with missing salary should appear last
        assert idx_c > max(idx_a, idx_b, idx_d), "Employee C with missing salary should appear last"
        # Employee D new hire with lower salary placed after A and B but before C
        assert idx_d > max(idx_a, idx_b) and idx_d < idx_c, "Employee D new hire should appear after A and B but before C"

    finally:
        # Cleanup: Delete all created test users
        for user_id in created_user_ids:
            try:
                del_resp = requests.delete(
                    f"{API_BASE_URL}/v1/users/{user_id}",
                    headers=HEADERS,
                    timeout=TIMEOUT
                )
                # Accept 200 or 204 as success, else log
                if del_resp.status_code not in (200, 204):
                    print(f"Warning: Failed to delete user {user_id} status: {del_resp.status_code}")
            except Exception as e:
                print(f"Exception during cleanup deleting user {user_id}: {str(e)}")


test_top_performers_scoring_logic_edge_cases()
