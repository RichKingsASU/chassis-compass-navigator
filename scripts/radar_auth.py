"""
BlackBerry Radar API authentication helper.

Supports two modes:
  1. JWT (ES256) — signs a short-lived token with an EC private key
  2. Plain Bearer — passes the API key directly

Set these in .env:
  RADAR_API_KEY          — the API client ID / key-id
  RADAR_PRIVATE_KEY      — PEM-encoded EC private key (for JWT mode)
  RADAR_PRIVATE_KEY_FILE — path to PEM file (alternative to inline key)

If no private key is provided, falls back to plain Bearer token.
"""

import os
import time
from pathlib import Path

import jwt  # PyJWT

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
API_KEY = os.getenv("RADAR_API_KEY", "")
_raw_priv = os.getenv("RADAR_PRIVATE_KEY", "")
_priv_file = os.getenv("RADAR_PRIVATE_KEY_FILE", "")

# Resolve private key
PRIVATE_KEY: str | None = None
if _raw_priv:
    PRIVATE_KEY = _raw_priv.replace("\\n", "\n")
elif _priv_file:
    p = Path(_priv_file).expanduser()
    if p.is_file():
        PRIVATE_KEY = p.read_text()

# Cache for the generated token
_cached_token: str | None = None
_cached_exp: float = 0


def _generate_jwt() -> str:
    """Create a short-lived ES256 JWT for the Radar API."""
    global _cached_token, _cached_exp  # noqa: PLW0603

    now = time.time()
    # Return cached token if still valid (with 60s buffer)
    if _cached_token and _cached_exp > now + 60:
        return _cached_token

    payload = {
        "iss": API_KEY,       # issuer = client / key ID
        "sub": API_KEY,       # subject
        "iat": int(now),
        "exp": int(now) + 300,  # 5-minute lifetime
    }
    token = jwt.encode(payload, PRIVATE_KEY, algorithm="ES256", headers={"kid": API_KEY})
    _cached_token = token
    _cached_exp = payload["exp"]
    return token


def auth_headers() -> dict[str, str]:
    """Return Authorization headers for the Radar API."""
    headers: dict[str, str] = {"Accept": "application/json"}

    if PRIVATE_KEY:
        token = _generate_jwt()
        headers["Authorization"] = f"Bearer {token}"
    elif API_KEY:
        headers["Authorization"] = f"Bearer {API_KEY}"

    return headers


def auth_mode() -> str:
    """Return a label describing the active auth mode."""
    if PRIVATE_KEY:
        return "JWT (ES256)"
    if API_KEY:
        return "Bearer token"
    return "none"
