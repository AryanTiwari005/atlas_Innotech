import hmac
from typing import Optional
from fastapi import Header, HTTPException, status
from backend.config import settings


def require_admin(x_admin_key: Optional[str] = Header(default=None)) -> None:
    """
    Guard for destructive endpoints.

    - If ADMIN_API_KEY is set: the caller must send a matching X-Admin-Key header.
    - If it is NOT set: destructive calls are allowed only outside production
      (so local dev and the test-suite keep working, but a production deploy
      without a key refuses to wipe data).
    """
    if settings.ADMIN_API_KEY:
        # constant-time compare so the key cannot be guessed via timing
        if not x_admin_key or not hmac.compare_digest(x_admin_key, settings.ADMIN_API_KEY):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Valid X-Admin-Key header required.")
        return
    if settings.APP_ENV.lower() == "production":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Destructive endpoints are disabled in production without ADMIN_API_KEY.")
