import { getCurrentHooksState } from "./hooks.js";

export function useEffect(callback, deps) {
  return getCurrentHooksState("useEffect").useEffect(callback, deps);
}

export function createEffectHook({ bus, history }) {
  let effectSlots = [];
  let pendingEffects = [];

  function useEffectAt(index, callback, deps) {
    const previous = effectSlots[index];
    const changed = !previous || depsChanged(previous.deps, deps);

    if (changed) {
      pendingEffects.push({ index, callback });
    }

    effectSlots[index] = {
      deps,
      cleanup: previous?.cleanup
    };
  }

  function flushEffects() {
    const effects = pendingEffects;
    pendingEffects = [];

    for (const effect of effects) {
      const slot = effectSlots[effect.index];

      if (typeof slot.cleanup === "function") {
        const cleanupEvent = bus.emit("effect:cleanup", {
          source: "reactsim",
          phase: "effect",
          slot: effect.index
        });
        history.record(cleanupEvent);
        slot.cleanup();
      }

      const runEvent = bus.emit("effect:run", {
        source: "reactsim",
        phase: "effect",
        slot: effect.index
      });
      history.record(runEvent);

      const cleanup = effect.callback();
      if (cleanup && typeof cleanup.then === "function") {
        const warningEvent = bus.emit("effect:warning", {
          source: "reactsim",
          phase: "effect",
          slot: effect.index,
          message:
            "useEffect callback returned a Promise. Start async work inside the effect and return a cleanup function instead."
        });
        history.record(warningEvent);
        slot.cleanup = undefined;
      } else {
        slot.cleanup = typeof cleanup === "function" ? cleanup : undefined;
      }
    }
  }

  function cleanupEffects() {
    for (const [index, slot] of effectSlots.entries()) {
      if (typeof slot?.cleanup !== "function") continue;

      const event = bus.emit("effect:cleanup", {
        source: "reactsim",
        phase: "effect",
        slot: index
      });
      history.record(event);
      slot.cleanup();
    }
  }

  function reset() {
    cleanupEffects();
    effectSlots = [];
    pendingEffects = [];
  }

  return { flushEffects, reset, useEffectAt };
}

function depsChanged(previousDeps, nextDeps) {
  if (nextDeps === undefined) return true;
  if (previousDeps === undefined) return true;
  if (previousDeps.length !== nextDeps.length) return true;
  return nextDeps.some((value, index) => !Object.is(value, previousDeps[index]));
}
