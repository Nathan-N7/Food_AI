import base64
import hashlib
import io
import secrets
from datetime import timedelta

import pyotp
import qrcode
from cryptography.fernet import Fernet
from django.conf import settings
from django.utils import timezone


ISSUER = "Food AI"
CHALLENGE_LIFETIME = timedelta(minutes=5)


def _fernet():
    key = base64.urlsafe_b64encode(
        hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    )
    return Fernet(key)


def encrypt_secret(secret):
    return _fernet().encrypt(secret.encode()).decode()


def decrypt_secret(value):
    return _fernet().decrypt(value.encode()).decode()


def generate_secret():
    return pyotp.random_base32(length=32)


def provisioning_uri(secret, user):
    return pyotp.TOTP(secret).provisioning_uri(
        name=user.email or user.username,
        issuer_name=ISSUER,
    )


def qr_data_uri(uri):
    image = qrcode.make(uri)
    output = io.BytesIO()
    image.save(output, format="PNG")
    encoded = base64.b64encode(output.getvalue()).decode()
    return f"data:image/png;base64,{encoded}"


def verify_code(secret, code):
    if not isinstance(code, str) or not code.isdigit() or len(code) != 6:
        return False
    return pyotp.TOTP(secret).verify(code, valid_window=1)


def new_challenge_token():
    return secrets.token_urlsafe(32)


def hash_challenge(token):
    return hashlib.sha256(token.encode()).hexdigest()


def challenge_expiry():
    return timezone.now() + CHALLENGE_LIFETIME
