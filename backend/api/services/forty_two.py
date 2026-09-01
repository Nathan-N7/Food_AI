from dataclasses import dataclass

import requests


AUTHORIZATION_URL = "https://api.intra.42.fr/oauth/authorize"
TOKEN_URL = "https://api.intra.42.fr/oauth/token"
ME_URL = "https://api.intra.42.fr/v2/me"
REQUEST_TIMEOUT_SECONDS = 10


class FortyTwoAPIError(Exception):
    """Raised when the 42 API cannot complete an OAuth operation."""


@dataclass(frozen=True)
class FortyTwoTokenResponse:
    access_token: str

    @classmethod
    def from_payload(cls, payload):
        access_token = payload.get("access_token")
        if not isinstance(access_token, str) or not access_token:
            raise FortyTwoAPIError("Invalid token response")
        return cls(access_token=access_token)


@dataclass(frozen=True)
class FortyTwoUserResponse:
    id: int
    login: str
    email: str

    @classmethod
    def from_payload(cls, payload):
        user_id = payload.get("id")
        login = payload.get("login")
        email = payload.get("email")
        if (
            not isinstance(user_id, int)
            or not isinstance(login, str)
            or not login
            or not isinstance(email, str)
            or not email
        ):
            raise FortyTwoAPIError("Invalid user response")
        return cls(id=user_id, login=login, email=email)


def exchange_code_for_token(code, client_id, client_secret, redirect_uri):
    try:
        response = requests.post(
            TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "client_id": client_id,
                "client_secret": client_secret,
                "code": code,
                "redirect_uri": redirect_uri,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return FortyTwoTokenResponse.from_payload(response.json())
    except (requests.RequestException, ValueError, TypeError, AttributeError) as exc:
        raise FortyTwoAPIError("Unable to exchange authorization code") from exc


def fetch_user(access_token):
    try:
        response = requests.get(
            ME_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        return FortyTwoUserResponse.from_payload(response.json())
    except (requests.RequestException, ValueError, TypeError, AttributeError) as exc:
        raise FortyTwoAPIError("Unable to fetch 42 user") from exc
