import { getCurrentHooksState } from "./hooks.js";

export function useState(initialValue) {
  return getCurrentHooksState("useState").useState(initialValue);
}

export function createStateHook({ bus, history, requestRender }) {
  let slots = [];

  function useStateAt(index, initialValue) {
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

    return [slots[index], setState];
  }

  function reset() {
    slots = [];
  }

  function getSlots() {
    return [...slots];
  }

  return { getSlots, reset, useStateAt };
}
