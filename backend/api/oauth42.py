"""OAuth 2.0 login with the Escola 42 (Intra 42) provider.

Manual implementation — no allauth.  The two views handle the full
authorization-code flow:
    1. ``FortyTwoAuthorizeView``  – 302 to 42 authorize endpoint.
    2. ``FortyTwoCallbackView``   – exchange code, fetch profile, login.
"""

import logging
import secrets
import urllib.parse

import requests as http_requests
from django.conf import settings
from django.contrib.auth import get_user_model, login
from django.http import HttpResponseRedirect
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from .models import Profile

User = get_user_model()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

AUTHORIZE_URL = "https://api.intra.42.fr/oauth/authorize"
TOKEN_URL = "https://api.intra.42.fr/oauth/token"
PROFILE_URL = "https://api.intra.42.fr/v2/me"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _success_redirect(extra_qs=None):
    """Build the redirect back to the frontend success page."""
    url = getattr(settings, "FORTY_TWO_SUCCESS_URL",
                  "https://localhost:8443/oauth/success")
    if extra_qs:
        url = f"{url}?{urllib.parse.urlencode(extra_qs)}"
    return HttpResponseRedirect(url)


def _error_redirect(message):
    """Redirect to success URL with ``?error=<message>``."""
    return _success_redirect({"error": message})


def _unique_username(base):
    """Return *base* if unused, otherwise append ``_2``, ``_3`` …."""
    if not User.objects.filter(username=base).exists():
        return base
    suffix = 2
    while User.objects.filter(username=f"{base}_{suffix}").exists():
        suffix += 1
    return f"{base}_{suffix}"


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------


class FortyTwoAuthorizeView(APIView):
    """GET /api/auth/42/authorize/

    Redirects the user's browser to the 42 OAuth authorize page.
    No authentication or CSRF required — this is a plain link target.
    """

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def get(self, request):
        state = secrets.token_urlsafe(32)
        request.session["oauth42_state"] = state
        request.session.save()

        params = {
            "client_id": settings.FORTY_TWO_CLIENT_ID,
            "redirect_uri": settings.FORTY_TWO_REDIRECT_URI,
            "response_type": "code",
            "scope": "public",
            "state": state,
        }
        url = f"{AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"
        return HttpResponseRedirect(url)


class FortyTwoCallbackView(APIView):
    """GET /api/auth/42/callback?code=...&state=...

    Completes the OAuth handshake: validates state, exchanges the code for a
    token, fetches the 42 profile, finds-or-creates the local user, logs
    them in, and redirects to the frontend success URL.
    """

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def get(self, request):
        # ------------------------------------------------------------------
        # 1. Validate state
        # ------------------------------------------------------------------
        returned_state = request.query_params.get("state", "")
        stored_state = request.session.pop("oauth42_state", None)

        if not stored_state or returned_state != stored_state:
            logger.warning("OAuth42 state mismatch (returned=%s)", returned_state)
            return _error_redirect("state_mismatch")

        code = request.query_params.get("code", "")
        if not code:
            return _error_redirect("missing_code")

        # ------------------------------------------------------------------
        # 2. Exchange authorization code for access token
        # ------------------------------------------------------------------
        try:
            token_resp = http_requests.post(
                TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": settings.FORTY_TWO_CLIENT_ID,
                    "client_secret": settings.FORTY_TWO_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.FORTY_TWO_REDIRECT_URI,
                },
                timeout=15,
            )
            token_resp.raise_for_status()
        except http_requests.RequestException:
            logger.exception("OAuth42 token exchange failed")
            return _error_redirect("token_exchange_failed")

        access_token = token_resp.json().get("access_token")
        if not access_token:
            logger.error("OAuth42 token response missing access_token: %s", token_resp.text)
            return _error_redirect("no_access_token")

        # ------------------------------------------------------------------
        # 3. Fetch 42 user profile
        # ------------------------------------------------------------------
        try:
            profile_resp = http_requests.get(
                PROFILE_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=15,
            )
            profile_resp.raise_for_status()
        except http_requests.RequestException:
            logger.exception("OAuth42 profile fetch failed")
            return _error_redirect("profile_fetch_failed")

        profile_data = profile_resp.json()

        intra_login = profile_data.get("login", "")
        intra_email = profile_data.get("email", "")
        first_name = profile_data.get("first_name", "")
        intra_id = profile_data.get("id")

        if not intra_login:
            logger.error("OAuth42 profile missing login field: %s", profile_data)
            return _error_redirect("missing_login")

        # ------------------------------------------------------------------
        # 4. Find or create the Django user
        # ------------------------------------------------------------------
        user = None

        # 4a. Try to find by email (if 42 provided one).
        if intra_email:
            try:
                user = User.objects.get(email=intra_email)
            except User.DoesNotExist:
                pass

        # 4b. Try to find by the 42 login as username.
        if user is None:
            try:
                user = User.objects.get(username=intra_login)
            except User.DoesNotExist:
                pass

        # 4c. Create a brand-new user.
        if user is None:
            username = _unique_username(intra_login)
            user = User.objects.create_user(
                username=username,
                email=intra_email or "",
                first_name=first_name,
            )
            user.set_unusable_password()
            user.save(update_fields=["password", "email", "first_name"])

        # ------------------------------------------------------------------
        # 5. Update profile (nickname only if empty / newly created)
        # ------------------------------------------------------------------
        profile, created = Profile.objects.get_or_create(user=user)
        if created or not profile.nickname:
            profile.nickname = intra_login or first_name or user.username
            profile.save(update_fields=["nickname"])

        # ------------------------------------------------------------------
        # 6. Log the user in (establishes session cookie)
        # ------------------------------------------------------------------
        login(request, user)

        # ------------------------------------------------------------------
        # 7. Redirect to frontend success URL
        # ------------------------------------------------------------------
        return _success_redirect()
