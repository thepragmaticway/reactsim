export function createEventBus() {
  const listeners = new Map();

  function on(type, callback) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(callback);
    return () => listeners.get(type).delete(callback);
  }

  function emit(type, payload = {}) {
    const event = {
      id: crypto.randomUUID(),
      type,
      time: performance.now(),
      ...payload
    };

    for (const callback of listeners.get(type) || []) callback(event);
    for (const callback of listeners.get("*") || []) callback(event);
    return event;
  }

  return { on, emit };
}
