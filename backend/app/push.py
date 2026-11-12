"""Expo push notifications. Silently no-ops for users without a push token."""

import logging
from collections.abc import Iterable

import httpx

from app.config import get_settings

log = logging.getLogger(__name__)

# Replaced in tests to capture outgoing pushes.
sent: list[dict] | None = None


def send_push(
    tokens: Iterable[str | None], title: str, body: str, data: dict | None = None, category: str | None = None
) -> None:
    """`category` maps to an app-side notification category with action buttons (e.g. "Extend")."""
    base = {"title": title, "body": body, "data": data or {}, "sound": "default"}
    if category:
        base["categoryId"] = category
    messages = [{"to": t, **base} for t in tokens if t]
    if not messages:
        return
    if sent is not None:
        sent.extend(messages)
        return
    try:
        httpx.post(get_settings().expo_push_url, json=messages, timeout=10).raise_for_status()
    except httpx.HTTPError:
        log.exception("Expo push failed")
