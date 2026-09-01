import os
import requests
import urllib.parse
from django.utils.crypto import get_random_string
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from django.contrib.auth import login
from django.contrib.auth.models import User
from django.core import signing
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token
from .models import UserProfile

class OAuth42LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        client_id = os.getenv("FORTYTWO_CLIENT_ID")
        redirect_uri = os.getenv("FORTYTWO_REDIRECT_URI")
        
        if not client_id or not redirect_uri:
            return Response({"error": "Configuração OAuth da 42 ausente"}, status=500)

        state = get_random_string(32)
        request.session["oauth_state"] = state
        
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "public",
            "state": state
        }
        url = f"https://api.intra.42.fr/oauth/authorize?{urllib.parse.urlencode(params)}"
        return HttpResponseRedirect(url)

class OAuth42CallbackView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        error = request.GET.get("error")
        if error:
            return redirect(f"/login?error={error}")

        code = request.GET.get("code")
        state = request.GET.get("state")

        # Validate state
        saved_state = request.session.pop("oauth_state", None)
        if not state or not saved_state or state != saved_state:
            return redirect("/login?error=invalid_state")

        if not code:
            return redirect("/login?error=missing_code")

        client_id = os.getenv("FORTYTWO_CLIENT_ID")
        client_secret = os.getenv("FORTYTWO_CLIENT_SECRET")
        redirect_uri = os.getenv("FORTYTWO_REDIRECT_URI")

        # Exchange code for token
        token_response = requests.post(
            "https://api.intra.42.fr/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
            }
        )
        if not token_response.ok:
            return redirect("/login?error=token_exchange_failed")
            
        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            return redirect("/login?error=missing_access_token")

        # Get user data
        user_response = requests.get(
            "https://api.intra.42.fr/v2/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if not user_response.ok:
            return redirect("/login?error=user_fetch_failed")

        user_data = user_response.json()
        fortytwo_id = user_data.get("id")
        email = user_data.get("email")
        login_name = user_data.get("login")
        display_name = user_data.get("displayname", "")

        if not fortytwo_id or not login_name:
            return redirect("/login?error=invalid_user_data")

        # Find or create user
        try:
            profile = UserProfile.objects.get(fortytwo_id=fortytwo_id)
            user = profile.user
        except UserProfile.DoesNotExist:
            # Fallback to email if user exists but has no fortytwo_id
            user = User.objects.filter(email=email).first() if email else None
            if not user:
                # Fallback to username
                user = User.objects.filter(username=login_name).first()
                if not user:
                    # Create new user
                    user = User.objects.create_user(username=login_name, email=email)
            
            # Update profile with fortytwo_id
            profile = user.profile
            profile.fortytwo_id = fortytwo_id
            if not profile.display_name:
                profile.display_name = display_name
            profile.save()

        # Handle 2FA
        if profile.two_factor_enabled:
            temp_token = signing.dumps({"user_id": user.id})
            return redirect(f"/login?require_2fa=true&temp_token={temp_token}")
            
        # Standard Token Login
        token, _ = Token.objects.get_or_create(user=user)
        return redirect(f"/login?token={token.key}&user_id={user.id}&username={user.username}")

