from backend.utils.storage import get_storage_backend

MEMORY_OBJECT_NAME = "memory/user_memory.json"
memory_store = {}
_loaded = False


def _ensure_loaded() -> None:
    global _loaded, memory_store
    if _loaded:
        return

    try:
        storage = get_storage_backend()
        persisted = storage.read_json(MEMORY_OBJECT_NAME)
        if isinstance(persisted, dict):
            memory_store = persisted
    except Exception:
        # Keep runtime behavior resilient when optional storage is unavailable.
        pass

    _loaded = True


def _persist() -> None:
    try:
        storage = get_storage_backend()
        storage.upload_json(MEMORY_OBJECT_NAME, memory_store)
    except Exception:
        # Memory persistence is best-effort and should not fail user requests.
        pass


def get_user_memory(user_id):
    _ensure_loaded()
    return memory_store.get(str(user_id), {})


def update_user_memory(user_id, data):
    _ensure_loaded()
    user_key = str(user_id)
    if user_key not in memory_store:
        memory_store[user_key] = {}

    memory_store[user_key].update(data)
    _persist()
