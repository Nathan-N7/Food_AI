import urllib.parse
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework.authtoken.models import Token


@database_sync_to_async
def get_user_from_token(token_key):
    try:
        token = Token.objects.select_related("user").get(key=token_key)
        return token.user
    except Token.DoesNotExist:
        return AnonymousUser()


class TokenAuthMiddleware:
    """
    Custom WebSocket middleware that authenticates users based on token passed in query string:
    e.g. ws://domain/ws/presence/?token=<token_key>
    or in headers: 'authorization': 'Token <token_key>'
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = urllib.parse.parse_qs(query_string)

        token_key = None
        if "token" in query_params:
            token_key = query_params["token"][0]

        if not token_key:
            # Check headers
            headers = dict(scope.get("headers", []))
            if b"authorization" in headers:
                auth_header = headers[b"authorization"].decode("utf-8")
                parts = auth_header.split()
                if len(parts) == 2 and parts[0].lower() in ["token", "bearer"]:
                    token_key = parts[1]

        if token_key:
            scope["user"] = await get_user_from_token(token_key)
        else:
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)


def TokenAuthMiddlewareStack(inner):
    return TokenAuthMiddleware(inner)
