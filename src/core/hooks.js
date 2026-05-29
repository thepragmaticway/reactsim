let currentHooksState = null;

export function setCurrentHooksState(hooksState) {
  currentHooksState = hooksState;
}

export function clearCurrentHooksState() {
  currentHooksState = null;
}

export function getCurrentHooksState(hookName) {
  if (!currentHooksState) {
    throw new Error(`${hookName} can only be called while Reactsim is rendering a component.`);
  }

  return currentHooksState;
}
