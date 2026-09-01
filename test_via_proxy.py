import requests

API_URL = 'http://localhost:8080/api'

# Register u1
requests.post(f"{API_URL}/auth/register/", json={"username": "u1", "password": "p", "email": "u1@e.com"})
r1 = requests.post(f"{API_URL}/auth/login/", json={"username": "u1", "password": "p"})
t1 = r1.json().get('token')
u1_id = requests.get(f"{API_URL}/profile/", headers={"Authorization": f"Token {t1}"}).json().get('id')

# Register u2
requests.post(f"{API_URL}/auth/register/", json={"username": "u2", "password": "p", "email": "u2@e.com"})
r2 = requests.post(f"{API_URL}/auth/login/", json={"username": "u2", "password": "p"})
t2 = r2.json().get('token')
u2_id = requests.get(f"{API_URL}/profile/", headers={"Authorization": f"Token {t2}"}).json().get('id')

# u1 sends friend request to u2
req = requests.post(
    f"{API_URL}/friends/request/",
    headers={"Authorization": f"Token {t1}"},
    json={"to_user_id": str(u2_id)}
)
print("Friend req status:", req.status_code, req.text)

