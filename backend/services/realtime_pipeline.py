from collections import deque
from datetime import datetime, timezone
from threading import Lock


class RealtimeEventPipeline:
    def __init__(self) -> None:
        self._lock = Lock()
        self._versions: dict[int, int] = {}
        self._recent_events: deque[dict] = deque(maxlen=500)

    def publish(self, user_id: int, event_type: str, payload: dict | None = None) -> int:
        with self._lock:
            next_version = self._versions.get(user_id, 0) + 1
            self._versions[user_id] = next_version
            self._recent_events.append(
                {
                    "user_id": user_id,
                    "event_type": event_type,
                    "payload": payload or {},
                    "version": next_version,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            return next_version

    def get_version(self, user_id: int) -> int:
        return self._versions.get(user_id, 0)

    def get_recent_events(self, user_id: int | None = None, limit: int = 50) -> list[dict]:
        if limit <= 0:
            return []

        events = list(self._recent_events)
        if user_id is not None:
            events = [event for event in events if event["user_id"] == user_id]

        return events[-limit:]


pipeline = RealtimeEventPipeline()
