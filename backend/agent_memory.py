memory_store = {}


def get_user_memory(user_id):
    return memory_store.get(user_id, {})


def update_user_memory(user_id, data):
    if user_id not in memory_store:
        memory_store[user_id] = {}

    memory_store[user_id].update(data)
