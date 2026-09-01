from pathlib import Path

import os
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


DEBUG = (
    os.getenv("DJANGO_DEBUG", "False").lower()
    == "true"
)

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    # Dev fallback ONLY when DEBUG is enabled; missing in production is fatal.
    ("development-only-secret-key" if DEBUG else None),
)

if not SECRET_KEY:
    raise RuntimeError(
        "DJANGO_SECRET_KEY is required in production. Set it in the "
        "environment (see backend/.env.example)."
    )

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "DJANGO_ALLOWED_HOSTS",
        "localhost,127.0.0.1,backend,food-ai-backend,web",
    ).split(",")
    if host.strip()
]

SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

# Comma-separated env-driven origins, with sensible dev defaults.
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "DJANGO_CORS_ALLOWED_ORIGINS",
        (
            "http://localhost:8501,http://127.0.0.1:8501,"
            "http://localhost:5173,http://127.0.0.1:5173,"
            "http://localhost:8080,http://127.0.0.1:8080,"
            "https://localhost:8443,https://127.0.0.1:8443"
        ),
    ).split(",")
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "DJANGO_CSRF_TRUSTED_ORIGINS",
        (
            "http://localhost:8080,http://127.0.0.1:8080,"
            "https://localhost:8443,https://127.0.0.1:8443,"
            "http://backend:8000"
        ),
    ).split(",")
    if origin.strip()
]


INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # libs externas
    "rest_framework",
    "corsheaders",
    "channels",

    # apps locais
    "api",
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    # The backend sits behind a single nginx proxy. Without NUM_PROXIES, the
    # AnonRateThrottle uses the proxy's IP as the key for every request, which
    # shared-throttles all users behind the proxy. Tells DRF to read the real
    # client IP from X-Forwarded-For so each user is throttled independently.
    'NUM_PROXIES': 1,
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/hour',
        'user_generate': '30/hour',
        'user_regenerate': '20/hour',
        'user_light': '120/hour',
    }
}

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# CSRF / session / CORS cookie hardening.
# CSRF token must be readable by JS so the SPA can send the X-CSRFToken header.
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CORS_ALLOW_CREDENTIALS = True

# Production hardening (enabled when DEBUG=False). nginx sets X-Forwarded-Proto
# (see SECURE_PROXY_SSL_HEADER above), so SECURE_SSL_REDIRECT won't loop.
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True


ROOT_URLCONF = "config.urls"


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

REDIS_HOST = os.getenv("REDIS_HOST", "redis")

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [(REDIS_HOST, 6379)],
        },
    }
}


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB"),
        "USER": os.getenv("POSTGRES_USER"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD"),
        "HOST": os.getenv("POSTGRES_HOST", "127.0.0.1"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


STATIC_URL = "static/"


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# ── Escola 42 (Intra 42) OAuth ──────────────────────────────────────────
FORTY_TWO_CLIENT_ID = os.getenv("FORTY_TWO_CLIENT_ID", "")
FORTY_TWO_CLIENT_SECRET = os.getenv("FORTY_TWO_CLIENT_SECRET", "")
FORTY_TWO_REDIRECT_URI = os.getenv(
    "FORTY_TWO_REDIRECT_URI",
    "https://localhost:8443/api/auth/42/callback",
)
FORTY_TWO_SUCCESS_URL = os.getenv(
    "FORTY_TWO_SUCCESS_URL",
    "https://localhost:8443/oauth/success",
)