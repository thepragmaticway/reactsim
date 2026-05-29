import { createEffectHook } from "./useEffect.js";
import { createStateHook } from "./useState.js";

export function createHooksState({ bus, history, requestRender }) {
  const stateHook = createStateHook({ bus, history, requestRender });
  const effectHook = createEffectHook({ bus, history });
  let cursor = 0;

  function beginRender() {
    cursor = 0;
  }

  function useState(initialValue) {
    return stateHook.useStateAt(nextHookIndex(), initialValue);
  }

  function useEffect(callback, deps) {
    effectHook.useEffectAt(nextHookIndex(), callback, deps);
  }

  function flushEffects() {
    effectHook.flushEffects();
  }

  function reset() {
    effectHook.reset();
    stateHook.reset();
    cursor = 0;
  }

  function getSlots() {
    return stateHook.getSlots();
  }

  return { beginRender, flushEffects, useEffect, useState, reset, getSlots };

  function nextHookIndex() {
    const index = cursor;
    cursor += 1;
    return index;
  }
}
