from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch, MagicMock
from django.contrib.auth.models import User
from .models import UserProfile

class OAuth42Tests(TestCase):
    def setUp(self):
        self.client = Client()
        self.login_url = reverse('oauth-42-login')
        self.callback_url = reverse('oauth-42-callback')
        
    @patch('api.oauth_views.os.getenv')
    def test_login_redirects_to_42(self, mock_getenv):
        mock_getenv.side_effect = lambda k: {
            "FORTYTWO_CLIENT_ID": "test_id",
            "FORTYTWO_REDIRECT_URI": "test_uri"
        }.get(k)
        
        response = self.client.get(self.login_url)
        self.assertEqual(response.status_code, 302)
        
        # Verify state is saved
        state = self.client.session.get('oauth_state')
        self.assertIsNotNone(state)
        
        url = response.url
        self.assertTrue(url.startswith("https://api.intra.42.fr/oauth/authorize"))
        self.assertIn("client_id=test_id", url)
        self.assertIn("redirect_uri=test_uri", url)
        self.assertIn("response_type=code", url)
        self.assertIn("scope=public", url)
        self.assertIn(f"state={state}", url)

    def test_callback_without_state_redirects_error(self):
        response = self.client.get(self.callback_url, {"code": "123", "state": "invalid"})
        self.assertEqual(response.status_code, 302)
        self.assertIn("error=invalid_state", response.url)
        
    def test_callback_without_code_redirects_error(self):
        session = self.client.session
        session['oauth_state'] = 'valid_state'
        session.save()
        response = self.client.get(self.callback_url, {"state": "valid_state"})
        self.assertEqual(response.status_code, 302)
        self.assertIn("error=missing_code", response.url)

    @patch('api.oauth_views.os.getenv')
    @patch('api.oauth_views.requests.get')
    @patch('api.oauth_views.requests.post')
    def test_callback_success_creates_new_user(self, mock_post, mock_get, mock_getenv):
        mock_getenv.side_effect = lambda k: {
            "FORTYTWO_CLIENT_ID": "test_id",
            "FORTYTWO_CLIENT_SECRET": "test_secret",
            "FORTYTWO_REDIRECT_URI": "test_uri"
        }.get(k)
        
        session = self.client.session
        session['oauth_state'] = 'valid_state'
        session.save()
        
        # Mock token exchange
        mock_post_resp = MagicMock()
        mock_post_resp.ok = True
        mock_post_resp.json.return_value = {"access_token": "mock_token"}
        mock_post.return_value = mock_post_resp
        
        # Mock user fetch
        mock_get_resp = MagicMock()
        mock_get_resp.ok = True
        mock_get_resp.json.return_value = {
            "id": 4242,
            "login": "testuser",
            "email": "test@student.42.fr",
            "displayname": "Test User"
        }
        mock_get.return_value = mock_get_resp
        
        response = self.client.get(self.callback_url, {"code": "valid_code", "state": "valid_state"})
        
        # Verify redirects with token
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.url.startswith("/login?token="))
        self.assertIn("user_id=", response.url)
        
        # Verify user was created
        user = User.objects.get(username="testuser")
        self.assertEqual(user.email, "test@student.42.fr")
        self.assertEqual(user.profile.fortytwo_id, 4242)
        
        # Verify POST kwargs
        mock_post.assert_called_once_with(
            "https://api.intra.42.fr/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": "test_id",
                "client_secret": "test_secret",
                "code": "valid_code",
                "redirect_uri": "test_uri",
            }
        )
        
        # Verify GET kwargs
        mock_get.assert_called_once_with(
            "https://api.intra.42.fr/v2/me",
            headers={"Authorization": "Bearer mock_token"}
        )

    @patch('api.oauth_views.os.getenv')
    @patch('api.oauth_views.requests.get')
    @patch('api.oauth_views.requests.post')
    def test_callback_success_existing_user(self, mock_post, mock_get, mock_getenv):
        mock_getenv.side_effect = lambda k: {
            "FORTYTWO_CLIENT_ID": "test_id",
            "FORTYTWO_CLIENT_SECRET": "test_secret",
            "FORTYTWO_REDIRECT_URI": "test_uri"
        }.get(k)
        
        # Create existing user
        user = User.objects.create_user(username="testuser")
        user.profile.fortytwo_id = 4242
        user.profile.save()
        
        session = self.client.session
        session['oauth_state'] = 'valid_state'
        session.save()
        
        # Mock token exchange
        mock_post_resp = MagicMock()
        mock_post_resp.ok = True
        mock_post_resp.json.return_value = {"access_token": "mock_token"}
        mock_post.return_value = mock_post_resp
        
        # Mock user fetch
        mock_get_resp = MagicMock()
        mock_get_resp.ok = True
        mock_get_resp.json.return_value = {
            "id": 4242,
            "login": "testuser",
        }
        mock_get.return_value = mock_get_resp
        
        response = self.client.get(self.callback_url, {"code": "valid_code", "state": "valid_state"})
        
        # Verify redirects with token
        self.assertEqual(response.status_code, 302)
        
        # Ensure only 1 user exists
        self.assertEqual(User.objects.count(), 1)
