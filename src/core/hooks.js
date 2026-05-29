let currentHooksState = null;

export function setCurrentHooksState(hooksState) {
  currentHooksState = hooksState;
}

export function clearCurrentHooksState() {
  currentHooksState = null;
}

export function useState(initialValue) {
  if (!currentHooksState) {
    throw new Error("useState can only be called while Reactsim is rendering a component.");
  }

  return currentHooksState.useState(initialValue);
}
