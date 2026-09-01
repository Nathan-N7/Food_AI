import requests

API_URL = 'http://localhost:8000/api'

# Register a test user
res = requests.post(f"{API_URL}/auth/register/", json={"username": "testuser_profile", "password": "testpassword", "email": "test@test.com"})
print("Register:", res.status_code, res.text)

# Login
res = requests.post(f"{API_URL}/auth/login/", json={"username": "testuser_profile", "password": "testpassword"})
print("Login:", res.status_code, res.text)
if res.status_code == 200:
    token = res.json().get('token')
    
    # Get Profile
    res_prof = requests.get(f"{API_URL}/profile/me/", headers={"Authorization": f"Token {token}"})
    print("Profile:", res_prof.status_code, res_prof.text)
