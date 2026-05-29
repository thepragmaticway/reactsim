import { createEventBus } from "./eventBus.js";
import { createHistory } from "./history.js";
import { createDomRenderer } from "./domRenderer.js";
import { createVirtualDom } from "./virtualDom.js";
import { createHooksState } from "./hooksState.js";
import { clearCurrentHooksState, setCurrentHooksState } from "./hooks.js";

export function createComponentRuntime(rootComponent, { root } = {}) {
  const bus = createEventBus();
  const history = createHistory();
  const domRenderer = createDomRenderer({ root, bus, history });
  const virtualDom = createVirtualDom({ bus, history, domRenderer });

  let scheduled = false;
  let renderCount = 0;
  let hooksState;

  function render(reason = "manual") {
    scheduled = false;
    hooksState.beginRender();

    const startEvent = bus.emit("runtime:render:start", {
      source: "reactsim",
      phase: "render",
      reason,
      renderCount: renderCount + 1
    });
    history.record(startEvent);

    let desiredTree;
    setCurrentHooksState(hooksState);
    try {
      desiredTree = rootComponent();
    } finally {
      clearCurrentHooksState();
    }

    const patches = virtualDom.render(desiredTree);
    renderCount += 1;

    const endEvent = bus.emit("runtime:render:end", {
      source: "reactsim",
      phase: "commit",
      renderCount,
      patchCount: patches.length
    });
    history.record(endEvent);
  }

  function requestRender() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => render("state update"));
  }

  hooksState = createHooksState({ bus, history, requestRender });

  function mount() {
    render("mount");
  }

  function reset() {
    renderCount = 0;
    scheduled = false;
    hooksState.reset();
    virtualDom.reset();
    history.clear();
    mount();
  }

  return {
    bus,
    history,
    mount,
    reset,
    render,
    getVirtualTree: virtualDom.getTree,
    getStateSlots: hooksState.getSlots
  };
}
