export function createHooksState({ bus, history, requestRender }) {
  let slots = [];
  let cursor = 0;

  function beginRender() {
    cursor = 0;
  }

  function useState(initialValue) {
    const index = cursor;
    if (slots[index] === undefined) slots[index] = initialValue;

    function setState(nextValue) {
      const previous = slots[index];
      const next = typeof nextValue === "function" ? nextValue(previous) : nextValue;
      if (Object.is(previous, next)) return;

      slots = slots.map((value, slotIndex) => (slotIndex === index ? next : value));
      const event = bus.emit("state:update", {
        source: "reactsim",
        phase: "schedule",
        slot: index,
        previous,
        next
      });
      history.record(event);
      requestRender();
    }

    cursor += 1;
    return [slots[index], setState];
  }

  function reset() {
    slots = [];
    cursor = 0;
  }

  function getSlots() {
    return [...slots];
  }

  return { beginRender, useState, reset, getSlots };
}
