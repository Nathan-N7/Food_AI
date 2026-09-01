from urllib.parse import parse_qs, urlparse
from unittest.mock import patch
import pyotp

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse

from api.models import Profile
from api.services.forty_two import (
    FortyTwoAPIError,
    FortyTwoTokenResponse,
    FortyTwoUserResponse,
    exchange_code_for_token,
    fetch_user,
)


class FortyTwoServiceTests(TestCase):
    @patch("api.services.forty_two.requests.post")
    def test_exchange_code_uses_backend_credentials(self, post):
        response = post.return_value
        response.json.return_value = {"access_token": "42-access-token"}

        token = exchange_code_for_token(
            "authorization-code",
            "client-id",
            "client-secret",
            "http://testserver/auth/42/callback",
        )

        self.assertEqual(token.access_token, "42-access-token")
        post.assert_called_once()
        self.assertEqual(post.call_args.kwargs["data"]["client_secret"], "client-secret")

    @patch("api.services.forty_two.requests.get")
    def test_fetch_user_calls_42_me_endpoint(self, get):
        response = get.return_value
        response.json.return_value = {
            "id": 42,
            "login": "student42",
            "email": "student42@example.test",
        }

        user = fetch_user("42-access-token")

        self.assertEqual(user.id, 42)
        self.assertEqual(
            get.call_args.kwargs["headers"],
            {"Authorization": "Bearer 42-access-token"},
        )


@override_settings(
    FORTYTWO_CLIENT_ID="client-id",
    FORTYTWO_CLIENT_SECRET="client-secret",
    FORTYTWO_REDIRECT_URI="http://testserver/auth/42/callback",
    OAUTH_FRONTEND_URL="http://frontend.test",
)
class FortyTwoOAuthTests(TestCase):
    def _set_oauth_state(self, state="expected-state"):
        session = self.client.session
        session["forty_two_oauth_state"] = state
        session.save()
        return state

    def _fragment(self, response):
        return parse_qs(urlparse(response.url).fragment)

    def test_login_redirect_contains_oauth_parameters_and_state(self):
        response = self.client.get(reverse("forty-two-login"))

        self.assertEqual(response.status_code, 302)
        parsed = urlparse(response.url)
        query = parse_qs(parsed.query)
        self.assertEqual(parsed.scheme, "https")
        self.assertEqual(parsed.netloc, "api.intra.42.fr")
        self.assertEqual(parsed.path, "/oauth/authorize")
        self.assertEqual(query["client_id"], ["client-id"])
        self.assertEqual(query["redirect_uri"], [
            "http://testserver/auth/42/callback",
        ])
        self.assertEqual(query["response_type"], ["code"])
        self.assertEqual(query["scope"], ["public"])
        self.assertTrue(query["state"][0])
        self.assertGreaterEqual(len(query["state"][0]), 43)
        self.assertEqual(
            self.client.session["forty_two_oauth_state"],
            query["state"][0],
        )

    def test_callback_rejects_invalid_state(self):
        self._set_oauth_state()

        response = self.client.get(
            reverse("forty-two-callback"),
            {"code": "code", "state": "wrong-state"},
        )

        self.assertEqual(response.status_code, 302)
        self.assertEqual(self._fragment(response)["oauth_error"], ["invalid_state"])

    def test_callback_handles_provider_error(self):
        state = self._set_oauth_state()

        response = self.client.get(
            reverse("forty-two-callback"),
            {"error": "access_denied", "state": state},
        )

        self.assertEqual(self._fragment(response)["oauth_error"], [
            "authorization_denied",
        ])

    def test_callback_rejects_missing_code(self):
        state = self._set_oauth_state()

        response = self.client.get(
            reverse("forty-two-callback"),
            {"state": state},
        )

        self.assertEqual(self._fragment(response)["oauth_error"], ["missing_code"])

    @patch("api.views.fetch_user")
    @patch("api.views.exchange_code_for_token")
    def test_callback_authenticates_existing_user(
        self,
        exchange_code_for_token,
        fetch_user,
    ):
        user = get_user_model().objects.create_user(
            username="existing42",
            email="existing@example.test",
        )
        Profile.objects.create(user=user, forty_two_id=42)
        exchange_code_for_token.return_value = FortyTwoTokenResponse("token")
        fetch_user.return_value = FortyTwoUserResponse(
            id=42,
            login="existing42",
            email="existing@example.test",
        )
        state = self._set_oauth_state()

        response = self.client.get(
            reverse("forty-two-callback"),
            {"code": "code", "state": state},
        )

        self.assertEqual(response.status_code, 302)
        fragment = self._fragment(response)
        self.assertTrue(fragment["oauth_token"][0])
        self.assertEqual(fragment["oauth_user_id"], [str(user.id)])
        exchange_code_for_token.assert_called_once()
        fetch_user.assert_called_once_with("token")

    @patch("api.views.fetch_user")
    @patch("api.views.exchange_code_for_token")
    def test_callback_creates_new_user(
        self,
        exchange_code_for_token,
        fetch_user,
    ):
        exchange_code_for_token.return_value = FortyTwoTokenResponse("token")
        fetch_user.return_value = FortyTwoUserResponse(
            id=42,
            login="new42",
            email="new42@example.test",
        )
        state = self._set_oauth_state()

        response = self.client.get(
            reverse("forty-two-callback"),
            {"code": "code", "state": state},
        )

        self.assertEqual(response.status_code, 302)
        user = get_user_model().objects.get(username="new42")
        self.assertFalse(user.has_usable_password())
        self.assertEqual(user.profile.forty_two_id, 42)
        self.assertTrue(self._fragment(response)["oauth_token"][0])

    @patch("api.views.exchange_code_for_token")
    def test_callback_handles_42_api_failure(self, exchange_code_for_token):
        exchange_code_for_token.side_effect = FortyTwoAPIError("failure")
        state = self._set_oauth_state()

        response = self.client.get(
            reverse("forty-two-callback"),
            {"code": "code", "state": state},
        )

        self.assertEqual(self._fragment(response)["oauth_error"], ["login_failed"])


@override_settings(REST_FRAMEWORK={"DEFAULT_THROTTLE_RATES": {"user": "1000/min"}})
class TwoFactorTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = get_user_model().objects.create_user(
            username="totp-user", email="totp@example.test", password="correct-pass"
        )
        self.profile = Profile.objects.create(user=self.user, nickname="TOTP")
        self.login_url = reverse("login")

    def _auth_headers(self):
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=self.user)
        return {"HTTP_AUTHORIZATION": f"Token {token.key}"}

    def _enable(self):
        response = self.client.post(reverse("two-factor-setup"), **self._auth_headers())
        self.assertEqual(response.status_code, 200)
        secret = __import__("api.services.two_factor", fromlist=["decrypt_secret"]).decrypt_secret(
            Profile.objects.get(user=self.user).two_factor_secret
        )
        code = pyotp.TOTP(secret).now()
        response = self.client.post(reverse("two-factor-confirm"), {"code": code}, **self._auth_headers())
        self.assertEqual(response.status_code, 200)
        return secret

    def test_user_without_2fa_gets_token(self):
        response = self.client.post(self.login_url, {"username": "totp-user", "password": "correct-pass"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.json())

    def test_setup_does_not_expose_secret_and_invalid_code_does_not_enable(self):
        response = self.client.post(reverse("two-factor-setup"), **self._auth_headers())
        self.assertEqual(response.status_code, 200)
        self.assertIn("qr_code", response.json())
        self.assertNotIn("secret", response.json())
        response = self.client.post(reverse("two-factor-confirm"), {"code": "000000"}, **self._auth_headers())
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Profile.objects.get(user=self.user).two_factor_enabled)

    def test_2fa_login_requires_and_accepts_totp_once(self):
        secret = self._enable()
        response = self.client.post(self.login_url, {"username": "totp-user", "password": "correct-pass"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["two_factor_required"])
        self.assertNotIn("token", response.json())
        challenge = response.json()["challenge"]
        response = self.client.post(reverse("two-factor-verify"), {"challenge": challenge, "code": "000000"})
        self.assertEqual(response.status_code, 401)
        response = self.client.post(reverse("two-factor-verify"), {"challenge": challenge, "code": pyotp.TOTP(secret).now()})
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.json())
        response = self.client.post(reverse("two-factor-verify"), {"challenge": challenge, "code": pyotp.TOTP(secret).now()})
        self.assertEqual(response.status_code, 401)

    def test_user_can_disable_2fa_with_password(self):
        self._enable()
        response = self.client.post(reverse("two-factor-disable"), {"password": "correct-pass"}, **self._auth_headers())
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Profile.objects.get(user=self.user).two_factor_enabled)
