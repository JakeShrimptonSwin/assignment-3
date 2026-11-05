#Jake S - Quickly tests the server against bad SQL
import requests

URL = "http://localhost:8000/login"

payloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "admin' --",
    "' OR 1=1 --",
    "'; DROP TABLE users; --",
    "\" OR \"\"=\"",
    "' UNION SELECT 1, 'x', 'y' --",
]

failures = 0
for p in payloads:
    # try the payload in the username, then in the password
    for creds in ({"username": p, "password": "x"}, {"username": "testuser", "password": p}):
        r = requests.post(URL, json=creds)
        ok = r.status_code == 401
        failures += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {r.status_code}  {creds}")

# sanity check: legitimate login still works
r = requests.post(URL, json={"username": "testuser", "password": "TestPassword123!"})
print(f"{'PASS' if r.status_code == 200 else 'FAIL'}  valid login -> {r.status_code}")

print(f"\n{failures} injection payload(s) got through")

INSECURE_URL = "http://localhost:8000/login-insecure"

print("\n--- Vulnerable endpoint (a 200 here means injection worked) ---")
for p in ["' OR '1'='1", "' OR '1'='1' --", "admin' --"]:
    r = requests.post(INSECURE_URL, json={"username": p, "password": "x"})
    print(f"{r.status_code}  {p!r}  ->  {r.text[:80]}")