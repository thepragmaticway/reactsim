export function createHistory(limit = 300) {
  const events = [];

  function record(event) {
    events.unshift(event);
    if (events.length > limit) events.pop();
  }

  function clear() {
    events.length = 0;
  }

  function all() {
    return [...events];
  }

  return { record, clear, all };
}
